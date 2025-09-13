import os
# from pymongo import MongoClient # No longer needed here
# from flask import Flask # No longer needed here
# from flask_cors import CORS # No longer needed here
# from app.routes.auth import bp as auth_bp # No longer needed here

from app import create_app # Import create_app from your app package
from socketio_instance import socketio

# Remove or comment out the separate init_db function if it duplicates logic in create_app
# def init_db():
#     client = MongoClient(os.getenv("MONGO_URI"))
#     db = client[os.getenv("MONGO_DB_NAME")]
    
#     # Create indexes for faster queries
#     db.users.create_index("email", unique=True)
#     db.app_scans.create_index("user_id")
#     db.app_scans.create_index("timestamp")

# Remove the direct Flask app creation and CORS application here
# app = Flask(__name__)
# CORS(app, origins="http://localhost:5173")

# Remove blueprint registration here
# app.register_blueprint(auth_bp, url_prefix='/api')

# Call create_app to get the configured app instance
app = create_app()
socketio.init_app(app)

if __name__ == '__main__':
    # Remove or comment out the init_db() call here if it's handled in create_app
    # init_db()
    socketio.run(app, host='0.0.0.0', port=5000)