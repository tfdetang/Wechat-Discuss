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
                   nickname=user.nickname,
                   username=user.username,
                   is_favoed=g.user.is_favoed_message(i.id),
                   avatar = app.config['BASE_URL']+'/avatar_'+str(i.author_id))

    if i.images.count() > 0:
        for j in i.images:
            images.append(j.full_url())
    message['images'] = images
    return message


def events_2_dict(events):
    message_list = []
    if events:
        for i in events:
            if i.type == 1:
                message = message_2_dict(i.get_message())
                message['type'] = i.type
                message['time'] = tools.timestamp_2_str(i.time)
                message_list.append(message)
            elif i.type == 2:
                message = message_2_dict(i.get_message())
                message['type'] = i.type
                message['quoted'] = message_2_dict(i.get_message().get_quoted_message())
                message['time'] = tools.timestamp_2_str(i.time)
                message_list.append(message)
            elif i.type == 4 or i.type == 5:
                message = message_2_dict(i.get_message())
                message['type'] = i.type
                message['sponsor_nickname'] = i.get_sponsor().nickname
                message['sponsor_id'] = i.sponsor
                message['time'] = tools.timestamp_2_str(i.time)
                message_list.append(message)
            elif i.type == 7:
                associate = i.get_associateuser()
                message = dict(sponsor_nickname=i.get_sponsor().nickname,
                               sponsor_id=i.sponsor,
                               associate_nickname=associate.nickname,
                               associate_id=associate.id)
                message['type'] = i.type
                message['time'] = tools.timestamp_2_str(i.time)
                message_list.append(message)
    return message_list


@app.route('/timeline/get_followed_message/', methods=['GET', 'POST'])
@login_required
def get_followed_message():
    limit = 20
    start = request.args.get('start', '0')
    query = g.user.followed_event()
    events = query.offset(int(start)).limit(limit).all()
    message_list = events_2_dict(events)
    result = dict(num=len(message_list),
                  message_list=message_list)
    return jsonify(result)


@app.route('/timeline/message_<id>/', methods=['GET','POST'])
def get_message(id):
    message = db.session.query(Message).filter(Message.id == id).one()
    message_dict = message_2_dict(message)
    if message.type == 2:
        quoted = db.session.query(Message).filter(Message.id == message.quote_id).one()
        message_dict['quoted'] = message_2_dict(quoted)
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


@app.route('/message/reply_message_<id>/', methods=['GET','POST'])
@login_required
def reply_message(id):
    comment = request.args.get('comment', ' ')
    try:
        message = db.session.query(Message).filter(Message.id == int(id)).one()
    except:
        return jsonify({'error': 'wrong_message_id'})
    g.user.comment_message(comment, int(id))
    return jsonify({'status': 'success'})


# ---------------------------------------用户相关接口-------------------------------


@app.route('/people/get_user_info/', methods=['GET','POST'])
@login_required
def get_user_info():
    id = request.args.get('user_id', '0')
    try:
        user = db.session.query(User).filter(User.id == int(id)).one()
    except:
        return jsonify({'error': 'wrong_user_id'})

    user_info = dict(nickname=user.nickname,
                     username=user.username,
                     city=user.city,
                     province=user.province,
                     country=user.country,
                     intro=user.get_profile().intro,
                     profile_img=user.get_profile().profile_img,
                     weixin_id=user.get_profile().weixin_id,
                     user_id=user.id,
                     followers=user.followers.count(),
                     followed_users=user.followed.count(),
                     avatar="http://{}/avatar_{}".format(app.config['BASE_URL'],user.id))
    if g.user.is_following(user.id):
        user_info['followed'] = 1
    else:
        user_info['followed'] = 0
    return jsonify(user_info)


@app.route('/people/get_user_message/', methods=['GET', 'POST'])
@login_required
def get_user_message():
    id = request.args.get('user_id', '0')
    try:
        user = db.session.query(User).filter(User.id == int(id)).one()
    except:
        return jsonify({'error': 'wrong_user_id'})
    limit = 20
    start = request.args.get('start', '0')
    query = user.self_event()
    events = query.offset(int(start)).limit(limit).all()
    message_list = events_2_dict(events)
    result = dict(num=len(message_list),
                  message_list=message_list)
    return jsonify(result)



@app.route('/people/follow_user/', methods=['GET', 'POST'])
@login_required
def follow_user():
    id = request.args.get('user_id', '0')
    try:
        user_follow = db.session.query(User).filter(User.id == int(id)).one()
    except:
        return jsonify({'error': 'wrong_user_id'})

    if g.user.is_following(user_follow.id):
        g.user.unfollow(user_follow.id)
        message = {'followed':'0'}
    else:
        g.user.follow(user_follow.id)
        message = {'followed':'1'}
    return jsonify(message)