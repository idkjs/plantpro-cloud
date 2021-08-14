#! /usr/bin/env python

import sqlite3
from sqlite3 import OperationalError

conn = sqlite3.connect('test.users.sqlite3')
cur = conn.cursor()

cur.execute('CREATE TABLE IF NOT EXISTS users ( \
          id INTEGER PRIMARY KEY AUTOINCREMENT, \
          is_verified INTEGER,\
          creation_time VARCHAR(256) NOT NULL,\
          email VARCHAR(256) NOT NULL UNIQUE,\
          user_name varchar(256) NOT NULL UNIQUE,\
          salt VARCHAR(256) NOT NULL,\
          p_hash VARCHAR(256) NOT NULL)');

cur.execute('CREATE TABLE IF NOT EXISTS devices (\
        device_id INTEGER PRIMARY KEY AUTOINCREMENT,\
        owner_id INTEGER NOT NULL, \
        creation_time varchar(256) NOT NULL,\
        name varchar(256) NOT NULL,\
        group_name varchar(256) NOT NULL,\
        device_code varchar(256) NOT NULL,\
        group_id INTEGER,\
        UNIQUE (owner_id, name),\
        FOREIGN KEY(owner_id) REFERENCES users(id)\
        FOREIGN KEY(group_id) REFERENCES groups(group_id))');

cur.execute('CREATE TABLE IF NOT EXISTS data (\
        data_id INTEGER PRIMARY KEY AUTOINCREMENT,\
        data_time varchar(256) NOT NULL,\
        owner_id INTEGER NOT NULL,\
        group_id INTEGER,\
        device_id INTEGER NOT NULL,\
        device_code varchar(256) NOT NULL,\
        sensor_type varchar(256) NOT NULL,\
        json varchar(4096) NOT NULL,\
        FOREIGN KEY(owner_id) REFERENCES users(id),\
        FOREIGN KEY(group_id) REFERENCES groups(group_id),\
        FOREIGN KEY(device_id) REFERENCES devices(device_id),\
        FOREIGN KEY(device_code) REFERENCES devices(device_code))');


cur.execute('CREATE TABLE IF NOT EXISTS data (\
    data_id INTEGER PRIMARY KEY AUTOINCREMENT,\
    data_time varchar(256) NOT NULL,\
    owner_id INTEGER NOT NULL,\
    group_id INTEGER,\
    device_id INTEGER NOT NULL,\
    device_code varchar(256) NOT NULL,\
    sensor_type varchar(256) NOT NULL,\
    json varchar(4096) NOT NULL,\
    FOREIGN KEY(owner_id) REFERENCES users(id),\
    FOREIGN KEY(group_id) REFERENCES groups(group_id),\
    FOREIGN KEY(device_id) REFERENCES devices(device_id),\
    FOREIGN KEY(device_code) REFERENCES devices(device_code))');


cur.execute('INSERT INTO users(creation_time, email, user_name, salt, p_hash, is_verified)\
        VALUES("4/20/16", "test@dummie", "test", "salt", "P_hash", 1)');

#first device
cur.execute('INSERT INTO devices(creation_time, name, device_code, owner_id, group_id, group_name)\
        VALUES("leftover time", "planty", "4200", 0, 0, "unsorted")');

cur.execute('INSERT INTO devices(creation_time, name, device_code, owner_id, group_id, group_name)\
        VALUES("leftover time", "peaches", "4201", 0, 0, "unsorted")');

cur.execute('SELECT id, user_name FROM users');

result = cur.fetchall()
i = 0

#tests single entry
if result[0][1] == 'test':
        print result[0][1]
        i = i + 1
else:
        print 'first test failed'

#tests adding 100 addational entries, 1 in 3 refferences the 2nd device
for x in range(0, 100):
        j = x
        j = j % 3
        j = j % 2
        insert = 'INSERT INTO data (owner_id, group_id, device_id, device_code, data_time, sensor_type, json)\
                VALUES(1, 0, ' + str(j) + ', ' + str(4200 + j) + ', "2", "light", "stock json");'
        cur.execute(insert);

cur.execute('Select data_id, data_time, json FROM data WHERE device_id = 0')
result = cur.fetchall()

if(len(result) == 67):
        i = i + 1

cur.execute('Select data_id, data_time, owner_id, group_id, device_id, device_code, sensor_type, json FROM data WHERE device_id = 1')
result = cur.fetchall()

if(len(result) == 33):
        i = i + 1

print str(i) + ' of 3 tests passed'

conn.close()




























