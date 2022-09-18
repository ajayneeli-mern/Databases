import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["ajay"]
mycol = mydb["system.views"]

mycol.drop()