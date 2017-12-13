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
import time, datetime

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


# ------------------------------------------------Associate_obj-------------------------------

follower = Table('follower', Base.metadata,
                 Column('follower_id', Integer, ForeignKey('user.id')),
                 Column('followed_id', Integer, ForeignKey('user.id')))


channel_2_message = Table('channel_2_message', Base.metadata,
                          Column('channel_id', Integer, ForeignKey('channel.id')),
                          Column('message_id', Integer, ForeignKey('message.id')))


# -----------------------------------------------Model---------------------------------------


class Token(Base, Utils, db.Model):
    '''
    id ：token的编号
    bind_user : token属于哪个用户
    secret : token密钥内容
    status ： token的状态 0 未使用 1 已验证 2 已过期
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

    def check_expire(self, expire_by=240):
        '''
        检查token是否过期
        :param expire_by: 过期时间（秒），默认240
        :return: T：未过期 or F:已过期
        '''
        t_now = tools.timestamp_2_time(time.time())
        t_create = tools.timestamp_2_time(self.create_time)
        t_gap = t_now - t_create
        if t_gap < datetime.timedelta(seconds=expire_by):
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
        self.valid_time = tools.generate_timestamp()
        self.status = 1
        self.update()
        return True

    def set_status(self, status='used'):
        '''
        设定token的状态
        :param status: used代表token已经验证过，expired代表token已经过期
        :return:
        '''
        if status == 'used':
            self.status = 1
            self.update()
        elif status == 'expired':
            self.status = 2
            self.update()

    def __repr__(self):
        return '<Token %s>' % self.id


class User(Base, Utils, db.Model, UserMixin):
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
    subscribe_time = Column(String(20))
    subscribe_status = Column(Integer)
    followed = relationship('User',
                            secondary=follower,
                            primaryjoin=(follower.c.follower_id == id),
                            secondaryjoin=(follower.c.followed_id == id),
                            backref=backref('followers', lazy='dynamic'),
                            lazy='dynamic')

    def is_authenticate(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        try:
            return self.id
        except:
            return None

    def follow(self, user):
        if not self.is_following(user):
            self.followed.append(user)
            self.save()
            return self

    def unfollow(self, user):
        if self.is_following(user):
            self.followed.remove(user)
            self.save()
            return self

    def is_following(self, user):
        return self.followed.filter(follower.c.followed_id == user.id).count() > 0

    def followed_message(self):
        return db.session.query(Message).join(follower, (follower.c.followed_id == Message.author_id)) \
            .filter(follower.c.follower_id == self.id) \
            .order_by(Message.time_update.desc())

    def post_message(self, body):
        channels = tools.match_channel(body+' ')
        message = Message(body=body,
                          time_create=tools.generate_timestamp(),
                          time_update=tools.generate_timestamp(),
                          author_id = self.id)
        message.save()
        for i in channels:
            message.add_channel(i[1:-1])
        return body

    def __repr__(self):
        return '<User %s>' % self.nickname


class Channel(Base, db.Model, Utils):
    __tablename__ = 'channel'
    __searchable__ = ['name']
    __analyzer__ = ChineseAnalyzer()

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(45))
    introduce = Column(Text)
    creator = Column(ForeignKey('user.id'))
    messages = relationship('Message',
                            secondary='channel_2_message',
                            backref='m_channel',
                            lazy='dynamic')

    def creat_channel(self):
        if not self.is_channel(self.name):
            new_theme = Channel(name=self.name,
                                introduce=self.introduce,
                                creator=self.creator)
            new_theme.save()

    def is_channel(self, name):
        return db.session.query(Channel).filter(Channel.name == name).count() > 0

    def __repr__(self):
        return '<Channel %s>' % self.name


class Message(Base, db.Model, Utils):
    __tablename__ = 'message'
    __searchable__ = ['body']
    __analyzer__ = ChineseAnalyzer()

    id = Column(Integer, primary_key=True, autoincrement=True)
    body = Column(String(260))
    time_create = Column(String(45))
    time_update = Column(String(45))
    comment_count = Column(Integer)
    share_count = Column(Integer)
    author_id = Column(ForeignKey('user.id'))
    channels = relationship('Channel',
                            secondary='channel_2_message',
                            backref='c_message',
                            lazy='dynamic')

    def add_channel(self,channel_name, introduce=''):
        '''
        将一条消息加入一个频道，如没有该频道则创建
        :param channel_name: 频道名称
        :param introduce: 介绍
        :return: Message
        '''
        if db.session.query(Channel).filter(Channel.name == channel_name).count() > 0:
            channel = db.session.query(Channel).filter(Channel.name == channel_name).first()
        else:
            channel = Channel(name=channel_name, introduce=introduce, creator=self.author_id)
        self.channels.append(channel)
        self.save()
        return self

    def __repr__(self):
        return '<Message %s>' % self.id



# ---------------------------------test-----------------------------------------------
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

    with app.app_context():
        user1 = db.session.query(User).filter(User.id == 1).one()
        user2 = db.session.query(User).filter(User.id == 2).one()
        user2.follow(user1)
        #user1.post_message('我们来测试一下#测试 是否能正常生效')
        #user2.post_message('也许这样是比较好的#多个频道 #极限测试')
        #query = user2.followed_message().order_by(Message.time_create.desc())
        query = db.session.query(Message).filter(Message.author_id == user1.id).order_by(Message.time_update.desc())
        print(query.first().time_update)



