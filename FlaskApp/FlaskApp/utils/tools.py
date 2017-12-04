import random
import string
from random import choice
import time
import datetime

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

#---------------------------test-------------------------------

if __name__ == '__main__':
    print(generate_token(5))
    print(generate_timestamp())
    print((timestamp_2_time(1512372186) - timestamp_2_time(1512370186)).total_seconds())