from pymongo import MongoClient

# Try to connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['consent_engine']

# Test the connection
try:
    # The ismaster command is cheap and does not require auth
    client.admin.command('ismaster')
    print("MongoDB connection successful!")
    print(f"Available databases: {client.list_database_names()}")
except Exception as e:
    print(f"MongoDB connection failed: {e}") 