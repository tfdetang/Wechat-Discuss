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
import json

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

@app.route('/auth/generate_token', methods=['GET', 'POST'])
def generate_token():
    token = Token(secret=tools.generate_token(5),
                  create_time=tools.generate_timestamp(),
                  status=0)
    token.save()
    return token.secret


@app.route('/auth/verify_token', methods=['GET', 'POST'])
def verify_token():
    token_web = request.args.get('token', '')
    try:
        token_db = db.session.query(Token).filter(Token.secret == token_web).one()
        if token_db.status == 1 and token_db.check_expire():
            user = load_user(token_db.bind_user)
            session['logged_in'] = True
            session['id'] = user.id
            session['username'] = user.nickname
            login_user(user, remember=True)
            return redirect(url_for('homepage'))
        else:
            return json.dumps({'status': 'fail'})
    except:
        return json.dumps({'status': 'fail'})  # todo: 异常处理


@app.route('/auth/autologin', methods=['GET', 'POST'])
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
        return redirect(url_for('homepage'))
    else:
        return json.dumps({'status': 'fail'}) # todo: 异常处理
