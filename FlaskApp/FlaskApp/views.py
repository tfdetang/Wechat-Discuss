import time

try:
    from FlaskApp.FlaskApp import app, db
except:
    import sys

    sys.path.append('..')
    from FlaskApp import app, db
from datetime import datetime
from functools import wraps

import markdown
from flask import render_template, flash, redirect, session, url_for, request, g, Markup
from flask_bcrypt import Bcrypt
from flask_login import login_user, current_user, LoginManager
from wechatpy import WeChatClient

from FlaskApp.Model import *
from FlaskApp.utils import tools

# ----------------------------init_settings----------------------------------

lm = LoginManager()
lm.init_app(app)
bcrypt = Bcrypt(app)


TOKEN = app.config['WEIXIN_TOKEN']
EncodingAESKey = app.config['WEIXIN_ENCODINGAESKEY']
AppId = app.config['WEIXIN_APPID']
Secret = app.config['WEIXIN_SECRET']

client = WeChatClient(AppId, Secret)


#--------------------------------------jinjia_setting------------------------------
app.jinja_env.globals['len'] = len
app.jinja_env.globals['str'] = str
app.jinja_env.globals['momentjs'] = tools.MomentJs
app.jinja_env.globals['Markup'] = Markup
app.jinja_env.globals['markdown'] = markdown.markdown
app.jinja_env.globals['baseurl'] = app.config['BASE_URL']


# -----------------------------events----------------------------------


@lm.user_loader
def load_user(id):
    db = g.db
    try:
        return db.session.query(User).filter(User.id == id).one()
    except:
        return None


def load_openid(openid):
    db = g.db
    return db.session.query(User).filter(User.openid == openid).one()


@app.before_request
def before_request():
    g.user = current_user
    g.db = db


def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            flash('请先登陆或注册！')
            return 'login_required' # todo 跳转到登录页
    return wrap


@app.route('/mobile/index/', methods=['GET', 'POST'])
def m_homepage():
    return render_template('mobile_index.html')


@app.route('/mobile/message/id_<messageid>')
def m_message_detail(messageid):
    message = db.session.query(Message).filter(Message.id == messageid).one()
    return render_template('mobile_message_detail.html', message=message)