from datetime import datetime
from werkzeug.security import generate_password_hash

class User:
    def __init__(self, mongo):
        self.users = mongo.db.users

    def create_user(self, name, email, password):
        hashed_pw = generate_password_hash(password)
        user_data = {
            "name": name,
            "email": email,
            "password": hashed_pw,
            "created_at": datetime.utcnow(),
            "scans": []
        }
        return self.users.insert_one(user_data).inserted_id