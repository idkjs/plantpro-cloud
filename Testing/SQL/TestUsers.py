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

cur.execute('INSERT INTO users(creation_time, email, user_name, salt, p_hash, is_verified)\
        VALUES("4/20/16", "test@dummie", "test", "salt", "P_hash", 1)');

cur.execute('SELECT id, user_name FROM users');

result = cur.fetchall()
i = 0

#tests single entry
if result[0][1] == 'test':
        print result[0][1]
        i = i + 1
else:
        print 'first test failed'

#tests adding 100 addational entries
mail = "test@dummie"
name = "test"

for x in range(0, 100):
        insert = 'INSERT INTO users(creation_time, email, user_name, salt, p_hash, is_verified)\
                VALUES("4/20/16", "test@dummie' + str(x) + '", "test ' + str(x) + '", "salt", "P_hash", 1)'
        cur.execute(insert);

cur.execute('SELECT id, user_name FROM users');
result = cur.fetchall()

#adds 1 to an array when the corrosponding data point is found
test = [0] * 101

for y in range(0, 100):
        test[result[y][0]] = 1


i += sum(test)

#removes 1 item from the array (id 1) and re fetches
cur.execute('DELETE from users WHERE id = 1')
cur.execute('SELECT id, user_name FROM users');
result = cur.fetchall()
if len(result) == 100:
        i = i + 1

print str(i) + " of 102 testes passed"
conn.close()
