import os
from datetime import timedelta

class Config:
    # Default values for development
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/consent_engine")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "consent_engine")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600)))
    SECRET_KEY = os.getenv("SECRET_KEY", "flask-secret-key")
    ALLOWED_ORIGINS = [os.getenv("ALLOWED_ORIGINS_1", "http://localhost:5173"), os.getenv("ALLOWED_ORIGINS_2", "http://localhost:5175")]
    
    # File upload configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'apk'}