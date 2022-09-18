import pymongo

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["mydatabase"]
mycol = mydb["customers"]

# x = mycol.find()#to find one item repleated
# for item in x:
#  print(x) 


# for x in mycol.find():
#   print(x)

# for x in mycol.find({},{ "_id": 1, "name": 2, "address": 3 }):#if we keep zer0 nor show that element
#   print(x)


myquery = { "address": "Canyon 123" }# exactly matching

# myquery = { "address": { "$lt": "S" } }#to find object starting with s and less than s
# myquery = { "address": { "$regex": "^S" } }#only s starting
mydoc = mycol.find(myquery)

for x in mydoc:
  print(x)
