import random
import string
from random import choice
import time
import datetime
from flask import Markup
from qiniu import Auth
from qiniu import BucketManager
import os

from FlaskApp.config import QINIU_AK, QINIU_SK, BUCKET

def generate_token(length=''):
    if not length:
        length = random.randint(3, 32)
    length = int(length)
    assert 3 <= length <= 32
    letters = string.ascii_letters + string.digits
    return ''.join(choice(letters) for _ in range(length))


def generate_timestamp():
    t = time.time()
    return int(t)


def timestamp_2_time(timestamp):
    return datetime.datetime.fromtimestamp(int(timestamp))


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