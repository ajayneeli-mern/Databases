import mysql.connector

class DBHelper:
    def __init__(self):
        self.mydb=mysql.connector.connect(
        host='localhost',
        user='root',
        password='9090',
        database='car_models')
        #query='create table '       Already created table by workbench by using import csv icon in tool
        print("table created  table name:car_models.cars")

    #insert
    def insert_data_intotable(self,mpg,cylinders,displacement,horsepower,weight,acceleration,model_year,origin,name):
        query="insert into car_models.cars(mpg,cylinders,displacement,horsepower,weight,acceleration,model_year,origin,name) values({},{},{},{},{},{},'{}','{}','{}')".format(mpg,cylinders,displacement,horsepower,weight,acceleration,model_year,origin,origin,name)
        print(query)
        cur=self.mydb.cursor()
        cur.execute(query)
        self.mydb.commit()#commit is permanent change in DB
        print("user saved to db")


    #fetchall
    def fetch_all(self):
        query="select * from car_models.cars"
        print(query)
        cur=self.mydb.cursor()
        cur.execute(query)   #just for reading DB no commit nessary
        for row in cur:
            print(row)



    #delete
    def delete(self,mpg):
        query="delete from car_models.cars where mpg={}".format(mpg)
        print(query)
        cur=self.mydb.cursor()
        cur.execute(query)
        self.mydb.commit()#commit is permanent change in DB  we not put commit it will not delete permantently store in mydb variable
        print("{} DELETED".format(mpg))



    #update 
    def updatedb(self,mpg,new_orgin,new_year):
        query="update car_models.cars set origin='{}',model_year={} where mpg={}".format(new_orgin,new_year,mpg)
        print(query)#above orgin and model year must much with DB columns
        cur=self.mydb.cursor()
        cur.execute(query)
        self.mydb.commit()#commit is permanent change in DB 
        print("{} UPDATED".format(mpg)) 


  
# helper=DBHelper()#for calling class
# #helper.insert_data_intotable(12,4,23,3,345,567,'2022','india',"ajay") 
# #helper.delete(44)#44,18,23
# #helper.updatedb(3,'india',2022)
# helper.fetch_all() 



