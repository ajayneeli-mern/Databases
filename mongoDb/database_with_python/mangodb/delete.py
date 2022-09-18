import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["ajay"]
mycol = mydb["customers"]

# myquery = { "address": "Mountain 21" }         #delete one

# mycol.delete_one(myquery)
myquery = { "address": {"$regex": "^M"} }         #delete many

x = mycol.delete_many(myquery)

print(x.deleted_count, " documents deleted.")



# delete all 
x = mycol.delete_many({})

print(x.deleted_count, " documents deleted.")