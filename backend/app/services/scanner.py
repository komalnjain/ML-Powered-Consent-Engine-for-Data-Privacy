from androguard.core.bytecodes.apk import APK
from androguard.core.bytecodes.dvm import DalvikVMFormat
from androguard.core.analysis.analysis import Analysis
from app.services.risk_calculator import RiskCalculator

class APKScanner:
    def __init__(self, mongo):
        self.mongo = mongo
        # Define dangerous permissions and their risk weights
        self.dangerous_permissions = {
            # High Risk (weight: 1.0)
            'READ_SMS': 1.0,
            'RECEIVE_SMS': 1.0,
            'READ_CONTACTS': 1.0,
            'ACCESS_FINE_LOCATION': 1.0,
            'RECORD_AUDIO': 1.0,
            'READ_CALL_LOG': 1.0,
            'CAMERA': 1.0,
            'READ_EXTERNAL_STORAGE': 1.0,
            'WRITE_EXTERNAL_STORAGE': 1.0,
            'ACCESS_COARSE_LOCATION': 1.0,
            
            # Medium Risk (weight: 0.7)
            'READ_PHONE_STATE': 0.7,
            'ACCESS_NETWORK_STATE': 0.7,
            'INTERNET': 0.7,
            'ACCESS_WIFI_STATE': 0.7,
            'WAKE_LOCK': 0.7,
            
            # Low Risk (weight: 0.3)
            'VIBRATE': 0.3,
            'RECEIVE_BOOT_COMPLETED': 0.3,
            'GET_ACCOUNTS': 0.3,
            'READ_SYNC_SETTINGS': 0.3,
            'WRITE_SYNC_SETTINGS': 0.3
        }

    def _extract_permissions(self, apk_path):
        """Extract permissions from an APK file"""
        try:
            apk = APK(apk_path)
            return apk.get_permissions()
        except Exception as e:
            print(f"Error extracting permissions: {str(e)}")
            return []

    def _calculate_risk_score(self, permissions):
        """Calculate risk score based on permissions"""
        total_weight = 0
        max_possible_weight = sum(self.dangerous_permissions.values())
        
        for perm in permissions:
            if perm in self.dangerous_permissions:
                total_weight += self.dangerous_permissions[perm]
        
        # Scale to 0-10
        return (total_weight / max_possible_weight) * 10 if max_possible_weight > 0 else 0

    def _get_critical_items(self, permissions):
        """Get list of critical permission combinations"""
        critical_items = []
        
        # Check for high-risk permission combinations
        if all(p in permissions for p in ['READ_SMS', 'RECEIVE_SMS']):
            critical_items.append("App can read and receive SMS messages")
        
        if all(p in permissions for p in ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION']):
            critical_items.append("App has access to precise location data")
        
        if all(p in permissions for p in ['CAMERA', 'RECORD_AUDIO']):
            critical_items.append("App can access camera and record audio")
        
        # Add individual high-risk permissions
        for perm in permissions:
            if perm in self.dangerous_permissions and self.dangerous_permissions[perm] >= 1.0:
                critical_items.append(f"App requests {perm.replace('_', ' ').lower()} permission")
        
        return critical_items

    def _get_permission_categories(self, permissions):
        """Get risk scores for different permission categories"""
        categories = {
            'SMS': ['READ_SMS', 'RECEIVE_SMS', 'SEND_SMS'],
            'Contacts': ['READ_CONTACTS', 'WRITE_CONTACTS'],
            'Location': ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
            'Storage': ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
            'Phone': ['READ_PHONE_STATE', 'READ_CALL_LOG'],
            'Media': ['CAMERA', 'RECORD_AUDIO'],
            'Network': ['INTERNET', 'ACCESS_NETWORK_STATE', 'ACCESS_WIFI_STATE'],
            'System': ['WAKE_LOCK', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED']
        }
        
        category_risks = {}
        for category, perms in categories.items():
            category_weight = 0
            for perm in perms:
                if perm in permissions and perm in self.dangerous_permissions:
                    category_weight += self.dangerous_permissions[perm]
            
            # Calculate category risk score (0-10)
            max_category_weight = sum(self.dangerous_permissions.get(p, 0) for p in perms)
            if max_category_weight > 0:
                category_risks[category] = round((category_weight / max_category_weight) * 10, 2)
            else:
                category_risks[category] = 0
        
        return category_risks

    def scan_apk(self, apk_path, user_id='anonymous', app_name=None):
        """Scan an APK file, log the result, and return risk assessment with scan_id"""
        permissions = self._extract_permissions(apk_path)
        print(f"[DEBUG] Extracted permissions: {permissions}")
        risk_calculator = RiskCalculator()
        result = risk_calculator.calculate_risk(permissions)
        # Log the scan result if mongo is available
        scan_id = None
        if self.mongo:
            from app.models.app_scan import AppScan
            app_scan_instance = AppScan(self.mongo)
            scan_id = app_scan_instance.log_scan(
                user_id=user_id,
                app_name=app_name or apk_path,
                risk_score=result.get('risk_score'),
                permissions=result.get('permissions'),
                categories=result.get('categories'),
                critical_items=result.get('critical_items')
            )
            result['scan_id'] = str(scan_id)
        return result 