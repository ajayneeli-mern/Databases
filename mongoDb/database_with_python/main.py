from re import M
from dbhelper import DBHelper

def main():
    db=DBHelper()#to call it #createing object
    print(db)
    print("connection created")
    while True:
        print("welcome to database")
        print("****select your choice*********")
        print("                                               ")
        print("press 1 to insert the user")
        print("press 2 to fetch user")
        print("press 3 to delete the user")
        print("press 4 to update the user")
        print("press 5 to exit")
        try:
            choice=int(input())
            if choice==1:
                db.insert_data_intotable()
            if choice==2:
                db.fetch_all()
            if choice==3:
                mpg=int(input("enter mpg to delete"))
                db.delete(mpg)
            if choice==4:
                pass
            if choice==5:
                break
        except Exception as e:
            print(e)
            print("invalid entry ") 


             
if __name__=="__main__":
    main()
               