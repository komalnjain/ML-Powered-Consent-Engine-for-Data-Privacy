from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models.user import User
from app.services.auth import validate_password
from app import mongo

bp = Blueprint('auth', __name__)

@bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    user = User(mongo)
    
    if user.users.find_one({"email": data['email']}):
        return jsonify({"error": "Email exists"}), 400
        
    user_id = user.create_user(data['name'], data['email'], data['password'])
    return jsonify({"id": str(user_id)}), 201

@bp.route('/login', methods=['POST'])
def login():
    email = request.json.get('email')
    password = request.json.get('password')
    user = mongo.db.users.find_one({"email": email})
    
    if not user or not validate_password(user['password'], password):
        return jsonify({"error": "Invalid credentials"}), 401
        
    access_token = create_access_token(identity=str(user['_id']))
    return jsonify({"token": access_token}), 200