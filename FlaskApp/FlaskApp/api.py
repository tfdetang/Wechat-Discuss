try:
    from FlaskApp.FlaskApp import app, db, handler
except:
    import sys

    sys.path.append('..')
    from FlaskApp import app, db, handler

from flask import flash, redirect, session, url_for, request, g, abort
from flask_login import logout_user, current_user
from wechatpy import parse_message
from wechatpy.crypto import WeChatCrypto
from wechatpy.exceptions import InvalidAppIdException
from wechatpy.exceptions import InvalidSignatureException
from wechatpy.utils import check_signature
from flask import jsonify
from wechatpy import replies

from FlaskApp import Model
from FlaskApp.utils import tools
from FlaskApp.views import *


# -------------------------------------微信接口-------------------------------------

@app.route('/wechat', methods=['GET', 'POST'])
def wechat():
    signature = request.args.get('signature', '')
    timestamp = request.args.get('timestamp', '')
    nonce = request.args.get('nonce', '')
    encrypt_type = request.args.get('encrypt_type', 'raw')
    msg_signature = request.args.get('msg_signature', '')
    try:
        check_signature(TOKEN, signature, timestamp, nonce)
    except InvalidSignatureException:
        abort(403)
    if request.method == 'GET':
        echo_str = request.args.get('echostr', '')
        return echo_str

    # POST request
    if encrypt_type == 'raw':
        # plaintext mode
        msg = parse_message(request.data)
        replies.EmptyReply().render()
        reply = handler.handle_msg(msg, AppId, Secret)
        return reply.render()
    else:
        # encryption mode
        crypto = WeChatCrypto(TOKEN, EncodingAESKey, AppId)
        try:
            msg = crypto.decrypt_message(
                request.data,
                msg_signature,
                timestamp,
                nonce
            )
        except (InvalidSignatureException, InvalidAppIdException):
            abort(403)
        else:
            msg = parse_message(msg)
            reply = handler.handle_msg(msg, AppId, Secret)
            return crypto.encrypt_message(reply.render(), nonce, timestamp)


# ---------------------------------------登陆_验证接口-------------------------------------------

@app.route('/auth/generate_token/', methods=['GET', 'POST'])
def generate_token():
    token = Token(secret=tools.generate_token(5),
                  create_time=tools.generate_timestamp(),
                  status=0)
    token.save()
    return token.secret


@app.route('/auth/verify_token/', methods=['GET', 'POST'])
def verify_token():
    token_web = request.args.get('token', '')
    try:
        token_db = db.session.query(Token).filter(Token.secret == token_web).first()
        if token_db.status == 1 and token_db.check_expire():
            user = load_user(token_db.bind_user)
            session['logged_in'] = True
            session['id'] = user.id
            session['username'] = user.nickname
            login_user(user, remember=True)
            return redirect(url_for('m_homepage'))
        else:
            return jsonify({'status': 'fail'})
    except:
        return jsonify({'status': 'fail'})  # todo: 异常处理


@app.route('/auth/autologin/', methods=['GET', 'POST'])
def auto_login():
    login_id = request.args.get('login_user', '')
    login_openid = request.args.get('user_secret', '')
    user = load_user(int(login_id))
    check = bcrypt.check_password_hash(login_openid, str(user.openid))
    if check:
        session['logged_in'] = True
        session['id'] = user.id
        session['username'] = user.nickname
        login_user(user, remember=True)
        return redirect(url_for('m_homepage'))
    else:
        return jsonify({'status': 'fail'})  # todo: 异常处理


# ----------------------------------------推文_获取相关接口--------------------------------------

def message_2_dict(i):
    '''
    输入一个message对象，获取其dict格式的信息
    :param i: message对象
    :return: dict对象
    '''
    user = load_user(i.author_id)
    images = []
    message = dict(id=i.id,
                   body=i.body,
                   time_create=tools.timestamp_2_str(i.time_create),
                   time_update=tools.timestamp_2_str(i.time_update),
                   comment_count=str(i.comment_count),
                   quote_count=str(i.quote_count),
                   favo_count=str(i.favo_users.count()),
                   author_id=i.author_id,
                   type=i.type,
                   nickname=user.nickname,
                   is_favoed=g.user.is_favoed_message(i.id))

    if i.images.count() > 0:
        for j in i.images:
            images.append(j.full_url())
    message['images'] = images

    if i.type == 2:
        quoted_message = db.session.query(Message).filter(Message.id == i.quote_id).one()
        quoted_user = load_user(quoted_message.author_id)
        quoted = dict(id=quoted_message.id,
                      body=quoted_message.body,
                      author_id=quoted_message.author_id,
                      nickname=quoted_user.nickname)
        if quoted_message.images.count() > 0:
            quoted['image'] = quoted_message.images[0].full_url()
        message['quoted'] = quoted
    return message


@app.route('/timeline/get_followed_message/', methods=['GET', 'POST'])
@login_required
def get_followed_message():
    limit = 10
    start = request.args.get('start', '0')
    query = g.user.followed_message().order_by(Message.time_create.desc())
    messages = query.offset(int(start)).limit(limit)
    message_list = []
    if messages:
        for i in messages:
            message = message_2_dict(i)
            message_list.append(message)
    result = dict(num=len(message_list),
                  message_list=message_list)
    return jsonify(result)


@app.route('/timeline/message_<id>/', methods=['GET','POST'])
def get_message(id):
    message = db.session.query(Message).filter(Message.id == id).one()
    message_dict = message_2_dict(message)
    return jsonify(message_dict)


@app.route('/timeline/message_<id>/get_replies', methods=['GET','POST'])
def get_replies(id):
    limit = 10
    start = request.args.get('start', '0')
    query = db.session.query(Message).order_by(Message.time_create.desc()).filter(Message.quote_id == id)
    replies = query.offset(int(start)).limit(limit)
    replies_list = []
    for i in replies:
        replies_list.append(message_2_dict(i))
    return jsonify({'count':len(replies_list),'replies':replies_list})


# ---------------------------------------推文操作相关接口-----------------------------


@app.route('/message/favo_message/', methods=['GET','POST'])
@login_required
def favo_message():
    message_id = request.args.get('message_id', '0')
    try:
        message = db.session.query(Message).filter(Message.id == message_id).one()
    except:
        return jsonify({'error': 'wrong_message_id'})
    if g.user.is_favoed_message(message_id):
        g.user.unfavo_message(message_id)
        favo = 0
    else:
        g.user.favo_message(message_id)
        favo = 1
    favo_count = message.favo_users.count()
    return jsonify({'favo':favo,'count':str(favo_count)})