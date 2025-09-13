# app/__init__.py
from flask import Flask
from flask_pymongo import PyMongo
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

# Initialize extensions
mongo = PyMongo()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://localhost:27017/consent_engine")
    app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER", "./uploads")
    app.config["ALLOWED_EXTENSIONS"] = {"apk"}
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # Set max upload size to 100 MB
    
    # Initialize MongoDB
    print("MONGO_URI:", app.config["MONGO_URI"])
    mongo.init_app(app)
    
    # Initialize JWT
    jwt.init_app(app)
    
    # Enable CORS
    allowed_origins = os.getenv('ALLOWED_ORIGINS', '*')
    print(f"ALLOWED_ORIGINS configured for CORS: {allowed_origins}")
    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "supports_credentials": True
        }
    })

    # Register blueprints with URL prefixes
    from .routes.auth import bp as auth_bp
    from .routes.scan import bp as scan_bp
    from .routes.user import bp as user_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(scan_bp, url_prefix='/api/scan')
    app.register_blueprint(user_bp, url_prefix='/api/user')

    # Create necessary MongoDB indexes
    with app.app_context():
        try:
            mongo.db.users.create_index('email', unique=True)
            mongo.db.app_scans.create_index([('user_id', 1), ('timestamp', -1)])
            print("MongoDB indexes created successfully")
        except Exception as e:
            print(f"Error creating MongoDB indexes: {e}")
            raise

    return app