try:
    from FlaskApp.FlaskApp import app, db
except:
    import sys

    sys.path.append('..')
    from FlaskApp import app, db
from sqlalchemy import Column, String, Integer, Text, ForeignKey, Table
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declarative_base, DeclarativeMeta
from flask_login import UserMixin
import flask_whooshalchemyplus as whooshalchemy
from jieba.analyse import ChineseAnalyzer
import time

from FlaskApp.utils import tools

Base = declarative_base()

# ----------------------------------------------Util_tools---------------------------------

class Utils:
    def save(self):
        db.session.add(self)
        db.session.commit()

    def update(self):
        db.session.merge(self)
        db.session.commit()

# -----------------------------------------------Model---------------------------------------


class Token(Base, Utils, db.Model):
    '''
    id ：token的编号
    bind_user : token属于哪个用户
    secret : token密钥内容
    status ： token的状态 0 未使用 1 已使用 2 已过期
    '''

    __tablename__ = 'token'

    id = Column(Integer, primary_key=True, autoincrement=True)
    bind_user = Column(ForeignKey('user.id'))
    secret = Column(String(10))
    create_time = Column(String(20))
    valid_time = Column(String(20))
    status = Column(Integer)

    def check_valid(self):
        '''
        检查token有效性
        :return: T:未使用 or F:已使用
        '''
        if self.status == 0:
            return True
        else:
            return False

    def check_expire(self, expire_by=120):
        '''
        检查token是否过期
        :param expire_by: 过期时间（秒），默认120
        :return: T：未过期 or F:已过期
        '''
        t_now = tools.timestamp_2_time(time.time())
        t_create = tools.timestamp_2_time(self.create_time)
        t_gap = t_now - t_create
        if t_gap < expire_by:
            return True
        else:
            self.set_status('expired')
            return False

    def bind(self, userid):
        '''
        绑定token与用户
        :param userid: 用户id
        :return: T: 绑定成功
        '''
        self.bind_user = userid
        self.update()
        return True

    def set_status(self,status='used'):
        '''
        设定token的状态
        :param status:
        :return:
        '''
        if status == 'used':
            self.status = 1
            self.update()
        elif status == 'expired':
            self.status = 2
            self.update()



class User(Base, Utils, db.Model,UserMixin):

    __tablename__ = 'user'
    __searchable__ = ['nickname']
    __analyzer__ = ChineseAnalyzer()

    id = Column(Integer, primary_key=True, autoincrement=True)
    openid = Column(String(45))
    nickname = Column(String(45))
    sex = Column(Integer)
    city = Column(String(20))
    province = Column(String(20))
    country = Column(String(20))
    headimgurl = Column(Text)
    subscribe_time = Column(String(20))


#---------------------------------test-----------------------------------------------
if __name__ == '__main__':

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, relationship, backref, scoped_session
    engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], pool_size=120,
                           pool_recycle=20)
    session_factory = sessionmaker(bind=engine)
    DBSession = scoped_session(session_factory)
    if app.config['DROP_ALL']:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)