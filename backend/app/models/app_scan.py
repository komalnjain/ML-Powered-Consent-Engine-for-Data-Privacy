from datetime import datetime
from bson.objectid import ObjectId

class AppScan:
    def __init__(self, mongo):
        self.scans = mongo.db.scans

    def log_scan(self, user_id, app_name, risk_score, permissions, categories, critical_items):
        scan_data = {
            "user_id": user_id,
            "app_name": app_name,
            "risk_score": risk_score,
            "permissions": permissions,
            "categories": categories,
            "critical_items": critical_items,
            "timestamp": datetime.utcnow()
        }
        return self.scans.insert_one(scan_data).inserted_id

    def get_scan_by_id(self, scan_id):
        """Retrieve a scan result by its ID"""
        try:
            return self.scans.find_one({"_id": ObjectId(scan_id)})
        except Exception as e:
            print(f"Error retrieving scan: {str(e)}")
            return None