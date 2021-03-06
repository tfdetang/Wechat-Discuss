import random
import string
from random import choice
import time
import datetime
from flask import Markup
from qiniu import Auth
from qiniu import BucketManager
import re
import os

from FlaskApp.config import QINIU_AK, QINIU_SK, BUCKET

def generate_token(length=''):
    '''
    生成一个随机字符串作为token
    :param length: token的长度
    :return: token字符串
    '''
    if not length:
        length = random.randint(3, 32)
    length = int(length)
    assert 3 <= length <= 32
    letters = string.ascii_letters + string.digits
    return ''.join(choice(letters) for _ in range(length))


def generate_timestamp():
    '''
    生成一个现在时间的时间戳
    :return: 时间戳
    '''
    t = time.time()
    return int(t)


def timestamp_2_time(timestamp):
    '''
    将时间戳转换为datetime时间的格式
    :param timestamp: 时间戳
    :return: datetime
    '''
    return datetime.datetime.fromtimestamp(int(timestamp))


def timestamp_2_str(timestamp):
    '''
    将时间戳转换为datetime时间的格式
    :param timestamp: 时间戳
    :return: datetime
    '''
    try:
        str_time = datetime.datetime.fromtimestamp(int(timestamp)).strftime('%Y-%m-%d %H:%M:%S')
    except:
        str_time = ''
    return str_time


def save_img(img_url,file_name):
    '''
    将url上的图片文件保存到七牛云
    :param img_url: 图片地址
    :param file_name: 保存文件名称
    :return: 保存图片信息
    '''
    bucket_name = BUCKET
    q = Auth(QINIU_AK, QINIU_SK)
    bucket = BucketManager(q)
    url = img_url
    key = file_name
    ret, info = bucket.fetch(url, bucket_name, key)
    return info


def match_channel(string):
    return re.findall(r"#.+?[\s,./;'\\，。/；’、]",string)


class MomentJs(object):
    def __init__(self, timestamp):
        '''
        moment.js的封装，用于显示各种时间格式
        :param timestamp: 输入数据库时间样式
        '''
        self.timestamp = timestamp

    def render(self, format):
        return Markup("<script>\ndocument.write(moment(\"%s\").%s);\n</script>" % (self.timestamp, format))

    def format(self, fmt):
        return self.render("format(\"%s\")" % fmt)

    def calendar(self):
        return self.render("calendar()")

    def fromNow(self):
        return self.render("fromNow()")

#---------------------------test-------------------------------

if __name__ == '__main__':
    print(generate_token(5))
    print(generate_timestamp())
    print((timestamp_2_time(1512372186) - timestamp_2_time(1512370186)).total_seconds())
    print(timestamp_2_str(1512372186))
    print(match_channel('asdfsdf #中文呢、ksdl#fkj '))