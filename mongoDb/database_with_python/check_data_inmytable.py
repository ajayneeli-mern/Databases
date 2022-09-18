import mysql.connector

mydb = mysql.connector.connect(
  host="localhost",
  user="root",
  password="9090",
  database="car_models"
)


mycursor = mydb.cursor()

mycursor.execute("SELECT * FROM car_models.cars")

myresult = mycursor.fetchall()

for x in myresult:
  print(x)