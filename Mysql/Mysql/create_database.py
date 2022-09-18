import mysql.connector
mydb=mysql.connector.connect(
    host='localhost',
    user='root',
    password='9090'
)                                                                      #stored connection in variable
mycursor = mydb.cursor()

# mycursor.execute("CREATE DATABASE ajay1")         #CREATE DATABASE
mycursor.execute("SHOW DATABASES")

for x in mycursor:
  print(x)