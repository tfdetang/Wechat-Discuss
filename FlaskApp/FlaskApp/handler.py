try:
    from FlaskApp.FlaskApp import app, db
except:
    import sys

    sys.path.append('..')
    from FlaskApp import app, db

from wechatpy import parse_message, create_reply
from wechatpy import WeChatClient
from FlaskApp import Model
from FlaskApp.utils import tools
from FlaskApp.views import bcrypt
import json

User = Model.User
Token = Model.Token


def handle_msg(msg, appid, secret):
    if msg.type == 'text':
        if varify_token(msg.source, msg.content):
            reply = create_reply('验证码正确，请稍后', msg)
        else:
            reply = create_reply(msg.content, msg)
    elif msg.type == 'event':
        if msg.event == 'subscribe':
            userinfo = get_user_info(msg.source, appid, secret)
            reply = create_reply('%s 欢迎您' % userinfo['nickname'], msg)
            save_user(userinfo)
        elif msg.event == 'click':
            if msg.key == 'Test_Page':
                user = db.session.query(User).filter(User.openid == msg.source).one()
                articles = [
                    {
                        'title': 'test',
                        'description': 'test',
                        'image': 'http://p0j80wqwd.bkt.clouddn.com/avatar_ou2oXwb9gVfysnk4j82NUbRCh40A',
                        'url': 'http://13.125.33.195/auth/autologin?login_user={}&user_secret={}'.format(str(user.id),
                                                                                                         bcrypt.generate_password_hash(
                                                                                                             user.openid))
                    },
                    # add more ...
                ]
                reply = create_reply(articles, msg)
    else:
        reply = create_reply('Sorry, can not handle this for now', msg)
    return reply


def save_user(userinfo):
    '''
    将新用户保存到数据库
    :param userinfo: 用户信息(dict)
    :return:
    '''
    with app.app_context():
        try:
            load_user = db.session.query(User).filter(User.openid == userinfo['openid']).one()
        except:
            new_user = User(openid=userinfo['openid'],
                            nickname=userinfo['nickname'],
                            sex=userinfo['sex'],
                            city=userinfo['city'],
                            province=userinfo['province'],
                            country=userinfo['country'],
                            subscribe_time=userinfo['subscribe_time'])
            new_user.save()
            tools.save_img(userinfo['headimgurl'], 'avatar_{}'.format(userinfo['openid']))


def varify_token(user_openid, user_input):
    '''
    验证token是否正确，以及是否有效
    :param user_openid: 用户的openid
    :param user_input: 用户输入的验证码
    :return: T:验证通过  F:验证失败
    '''
    try:
        load_token = db.session.query(Token).filter(Token.secret == user_input).one()
        load_user = db.session.query(User).filter(User.openid == user_openid).one()
    except:
        return False
    if load_token.check_valid() and load_token.check_expire():
        with app.app_context():
            load_token.bind(load_user.id)
            return True
    else:
        return False


def get_user_info(openid, appid, secret):
    '''
    通过公众号主动请求接口，请求某个用户的个人信息
    :param openid: 用户的openid
    :param appid: 应用id
    :param secret: 应用密钥
    :return: 用户的个人信息（dict）
    '''
    client = WeChatClient(appid, secret)
    userinfo = client.user.get(openid)
    return userinfo


# -----------------------------------------测试--------------------------------------

if __name__ == '__main__':
    #userinfo = get_user_info('ou2oXwcn0iN0sf1zgsSJJQg99beo', 'wx9c728c1afc645e1b', 'eaeeb1a506588334ced664b8128a02fc')
    #print(userinfo)
    encrypt = bcrypt.generate_password_hash('ou2oXwcn0iN0sf1zgsSJJQg99beo')
    print(encrypt)
    check = bcrypt.check_password_hash(encrypt,str('ou2oXwcn0iN0sf1zgsSJJQg99beo'))
    print(check)
