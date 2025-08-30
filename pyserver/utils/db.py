from pymongo import MongoClient, errors
import os
from dotenv import load_dotenv

load_dotenv()

DB_URI = os.getenv("DB_URI")
DB_NAME = os.getenv("DB_NAME", "notes_app")

print("*"*10, "DB_URI:", DB_URI, "*"*10)
print("*"*10, "DB_NAME:", DB_NAME, "*"*10)

try:
    client = MongoClient(DB_URI, serverSelectionTimeoutMS=5000)
    
    client.admin.command("ping")
    
    db = client[DB_NAME]
    print("*"*10, "Connected to DB:", db.name, "*"*10)
    
    notes_collection = db["notes"]

except errors.ServerSelectionTimeoutError as err:
    print("Failed to connect to MongoDB:", err)
    notes_collection = None
