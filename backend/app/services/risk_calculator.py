import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import os

print("=== USING UPDATED RISK CALCULATOR ===")

class RiskCalculator:
    def __init__(self):
        # Use absolute paths to guarantee the model and vectorizer are found
        model_path = r'D:/consent-engine-web/ml/training_scripts/ml/models/risk_model_20250607_234152.pkl'
        vectorizer_path = r'D:/consent-engine-web/ml/training_scripts/ml/models/feature_vectorizer_20250607_234152.pkl'
        print(f"Loading model from: {model_path}")
        self.model = joblib.load(model_path)
        self.vectorizer = joblib.load(vectorizer_path)
        
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
        
        # Define permission categories
        self.permission_categories = {
            'SMS': ['READ_SMS', 'RECEIVE_SMS', 'SEND_SMS'],
            'Contacts': ['READ_CONTACTS', 'WRITE_CONTACTS'],
            'Location': ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
            'Storage': ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
            'Phone': ['READ_PHONE_STATE', 'READ_CALL_LOG'],
            'Media': ['CAMERA', 'RECORD_AUDIO'],
            'Network': ['INTERNET', 'ACCESS_NETWORK_STATE', 'ACCESS_WIFI_STATE'],
            'System': ['WAKE_LOCK', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED']
        }
    
    def calculate_risk(self, permissions, policy_text=None):
        print("=== calculate_risk CALLED ===")
        # Calculate base risk from permissions
        base_risk = self._calculate_permission_risk(permissions)
        
        # Calculate category risks
        category_risks = self._calculate_category_risks(permissions)
        
        # Get critical items
        critical_items = self._get_critical_items(permissions)
        
        # If policy text is provided, incorporate it into the risk calculation
        if policy_text:
            text_features = self.vectorizer.transform([policy_text])
            policy_risk = self.model.predict_proba(text_features.toarray())[0][1] * 10
            final_risk = (base_risk + policy_risk) / 2
        else:
            final_risk = base_risk
        
        return {
            'risk_score': round(final_risk, 2),
            'categories': category_risks,
            'critical_items': critical_items,
            'permissions': self._format_permissions(permissions)
        }
    
    def _normalize_permission(self, perm):
        prefixes = [
            "android.permission.",
            "com.google.android.gms.permission.",
            "com.android.vending.",
            "com.sonyericsson.home.permission.",
            "com.google.android.providers.gsf.permission.",
            "com.sec.android.provider.badge.permission.",
            "com.google.android.c2dm.permission.",
            "com.sonymobile.home.permission.",
            "com.htc.launcher.permission.",
            "com.google.android.youtube.permission.",
            "com.google.android.youtube.",
        ]
        for prefix in prefixes:
            if perm.startswith(prefix):
                return perm[len(prefix):]
        return perm

    def _calculate_permission_risk(self, permissions):
        total_weight = 0
        max_possible_weight = sum(self.dangerous_permissions.values())
        print(f"DEBUG: max_possible_weight = {max_possible_weight}")
        print(f"DEBUG: dangerous_permissions keys = {list(self.dangerous_permissions.keys())}")
        
        for perm in permissions:
            norm_perm = self._normalize_permission(perm)
            print(f"DEBUG: {perm} -> {norm_perm}")
            if norm_perm in self.dangerous_permissions:
                weight = self.dangerous_permissions[norm_perm]
                total_weight += weight
                print(f"DEBUG: MATCHED! {norm_perm} has weight {weight}")
            else:
                print(f"DEBUG: NO MATCH for {norm_perm}")
        
        print(f"DEBUG: total_weight = {total_weight}")
        result = (total_weight / max_possible_weight) * 10 if max_possible_weight > 0 else 0
        print(f"DEBUG: final risk score = {result}")
        return result
    
    def _calculate_category_risks(self, permissions):
        category_risks = {}
        for category, perms in self.permission_categories.items():
            category_weight = 0
            for perm in perms:
                for p in permissions:
                    norm_p = self._normalize_permission(p)
                    if norm_p == perm and norm_p in self.dangerous_permissions:
                        category_weight += self.dangerous_permissions[norm_p]
            max_category_weight = sum(self.dangerous_permissions.get(p, 0) for p in perms)
            if max_category_weight > 0:
                category_risks[category] = round((category_weight / max_category_weight) * 10, 2)
            else:
                category_risks[category] = 0
        return category_risks
    
    def _get_critical_items(self, permissions):
        critical_items = []
        perms_norm = set(self._normalize_permission(p) for p in permissions)
        if all(p in perms_norm for p in ['READ_SMS', 'RECEIVE_SMS']):
            critical_items.append("App can read and receive SMS messages")
        if all(p in perms_norm for p in ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION']):
            critical_items.append("App has access to precise location data")
        if all(p in perms_norm for p in ['CAMERA', 'RECORD_AUDIO']):
            critical_items.append("App can access camera and record audio")
        for perm in perms_norm:
            if perm in self.dangerous_permissions and self.dangerous_permissions[perm] >= 1.0:
                critical_items.append(f"App requests {perm.replace('_', ' ').lower()} permission")
        return critical_items
    
    def _format_permissions(self, permissions):
        formatted_permissions = []
        for perm in permissions:
            norm_perm = self._normalize_permission(perm)
            risk = self.dangerous_permissions.get(norm_perm, 0)
            risk_level = 'high' if risk >= 1.0 else 'medium' if risk >= 0.7 else 'low'
            formatted_permissions.append({
                'name': perm,
                'description': self._get_permission_description(norm_perm),
                'risk': risk * 10,  # Scale to 0-10
                'enabled': True,
                'remediation': self._get_remediation_suggestion(norm_perm)
            })
        return formatted_permissions
    
    def _get_permission_description(self, permission):
        descriptions = {
            'READ_SMS': 'Allows the app to read SMS messages',
            'RECEIVE_SMS': 'Allows the app to receive SMS messages',
            'READ_CONTACTS': 'Allows the app to read your contacts',
            'ACCESS_FINE_LOCATION': 'Allows the app to access precise location',
            'RECORD_AUDIO': 'Allows the app to record audio',
            'READ_CALL_LOG': 'Allows the app to read call logs',
            'CAMERA': 'Allows the app to access the camera',
            'READ_EXTERNAL_STORAGE': 'Allows the app to read external storage',
            'WRITE_EXTERNAL_STORAGE': 'Allows the app to write to external storage',
            'ACCESS_COARSE_LOCATION': 'Allows the app to access approximate location',
            'READ_PHONE_STATE': 'Allows the app to read phone state',
            'ACCESS_NETWORK_STATE': 'Allows the app to access network information',
            'INTERNET': 'Allows the app to access the internet',
            'ACCESS_WIFI_STATE': 'Allows the app to access WiFi information',
            'WAKE_LOCK': 'Allows the app to prevent device from sleeping',
            'VIBRATE': 'Allows the app to control vibration',
            'RECEIVE_BOOT_COMPLETED': 'Allows the app to start on device boot',
            'GET_ACCOUNTS': 'Allows the app to access accounts on the device',
            'READ_SYNC_SETTINGS': 'Allows the app to read sync settings',
            'WRITE_SYNC_SETTINGS': 'Allows the app to write sync settings'
        }
        return descriptions.get(permission, f'Allows the app to {permission.lower().replace("_", " ")}')
    
    def _get_remediation_suggestion(self, permission):
        suggestions = {
            'READ_SMS': 'Consider if SMS access is necessary for core functionality',
            'RECEIVE_SMS': 'Consider if SMS receiving is necessary for core functionality',
            'READ_CONTACTS': 'Consider if contact access is necessary for core functionality',
            'ACCESS_FINE_LOCATION': 'Consider using coarse location instead if precise location is not required',
            'RECORD_AUDIO': 'Consider if audio recording is necessary for core functionality',
            'READ_CALL_LOG': 'Consider if call log access is necessary for core functionality',
            'CAMERA': 'Consider if camera access is necessary for core functionality',
            'READ_EXTERNAL_STORAGE': 'Consider using app-specific storage instead',
            'WRITE_EXTERNAL_STORAGE': 'Consider using app-specific storage instead',
            'ACCESS_COARSE_LOCATION': 'Consider if location access is necessary for core functionality',
            'READ_PHONE_STATE': 'Consider if phone state access is necessary for core functionality',
            'ACCESS_NETWORK_STATE': 'Consider if network state access is necessary for core functionality',
            'INTERNET': 'Consider if internet access is necessary for core functionality',
            'ACCESS_WIFI_STATE': 'Consider if WiFi state access is necessary for core functionality',
            'WAKE_LOCK': 'Consider if wake lock is necessary for core functionality',
            'VIBRATE': 'Consider if vibration control is necessary for core functionality',
            'RECEIVE_BOOT_COMPLETED': 'Consider if auto-start is necessary for core functionality',
            'GET_ACCOUNTS': 'Consider if account access is necessary for core functionality',
            'READ_SYNC_SETTINGS': 'Consider if sync settings access is necessary for core functionality',
            'WRITE_SYNC_SETTINGS': 'Consider if sync settings modification is necessary for core functionality'
        }
        return suggestions.get(permission, 'Review if this permission is necessary for core functionality')

    def test_risk_prediction(self):
        """Test function to demonstrate risk prediction with different permission combinations"""
        test_cases = [
            # High Risk Cases
            {
                'name': 'High Risk - SMS and Location',
                'permissions': ['READ_SMS', 'RECEIVE_SMS', 'ACCESS_FINE_LOCATION'],
                'expected_level': 'high'
            },
            {
                'name': 'High Risk - Camera and Audio',
                'permissions': ['CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE'],
                'expected_level': 'high'
            },
            # Medium Risk Cases
            {
                'name': 'Medium Risk - Network and Phone',
                'permissions': ['INTERNET', 'ACCESS_NETWORK_STATE', 'READ_PHONE_STATE'],
                'expected_level': 'medium'
            },
            {
                'name': 'Medium Risk - Location and Network',
                'permissions': ['ACCESS_COARSE_LOCATION', 'ACCESS_WIFI_STATE'],
                'expected_level': 'medium'
            },
            # Low Risk Cases
            {
                'name': 'Low Risk - Basic Permissions',
                'permissions': ['VIBRATE', 'WAKE_LOCK'],
                'expected_level': 'low'
            },
            {
                'name': 'Low Risk - System Only',
                'permissions': ['RECEIVE_BOOT_COMPLETED', 'READ_SYNC_SETTINGS'],
                'expected_level': 'low'
            }
        ]

        results = []
        for case in test_cases:
            risk_analysis = self.calculate_risk(case['permissions'])
            risk_level = 'high' if risk_analysis['risk_score'] >= 7.0 else 'medium' if risk_analysis['risk_score'] >= 4.0 else 'low'
            
            results.append({
                'test_case': case['name'],
                'permissions': case['permissions'],
                'risk_score': risk_analysis['risk_score'],
                'risk_level': risk_level,
                'expected_level': case['expected_level'],
                'passed': risk_level == case['expected_level'],
                'categories': risk_analysis['categories'],
                'critical_items': risk_analysis['critical_items']
            })

        return results

PERMISSION_KNOWLEDGE_BASE = {
    "CAMERA": {
        "risk": "High",
        "abuse": "Can be used to spy on users.",
        "compliance": "Needs clear user consent under GDPR/DPDP."
    },
    "ACCESS_FINE_LOCATION": {
        "risk": "High",
        "abuse": "Tracks precise user location.",
        "compliance": "Should only be used if essential; prefer coarse location."
    },
    "READ_CONTACTS": {
        "risk": "High",
        "abuse": "Can access user contacts and social graph.",
        "compliance": "Needs explicit user consent."
    },
    "INTERNET": {
        "risk": "Medium",
        "abuse": "Can send data externally.",
        "compliance": "Should be justified in privacy policy."
    },
    # ...add more permissions as needed
}

class PermissionOptimizer:
    """
    Suggests minimal permissions for app features and recommends removal of unnecessary permissions
    based on risk model feedback.
    """
    # Mapping of app features to minimal required permissions
    MINIMAL_PERMISSIONS = {
        "camera": {"CAMERA"},
        "location": {"ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"},
        "contacts": {"READ_CONTACTS"},
        "sms": {"SEND_SMS", "RECEIVE_SMS"},
        "storage": {"READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"},
        "audio": {"RECORD_AUDIO"},
        "phone": {"READ_PHONE_STATE"},
        "network": {"INTERNET", "ACCESS_NETWORK_STATE", "ACCESS_WIFI_STATE"},
        # Add more mappings as needed
    }

    def __init__(self, risk_calculator=None):
        self.risk_calculator = risk_calculator or RiskCalculator()

    def recommend_minimal_permissions(self, app_features, requested_permissions):
        """
        Returns the minimal set of permissions needed for the app's features.
        """
        minimal_set = set()
        for feature in app_features:
            minimal_set.update(self.MINIMAL_PERMISSIONS.get(feature, set()))
        return list(minimal_set)

    def optimize_permissions(self, app_features, requested_permissions, policy_text=None, policy_summary=None):
        """
        Suggests which permissions can be removed to lower risk, while maintaining required features.
        Returns a list of recommendations with expected risk reduction.
        """
        minimal_set = set(self.recommend_minimal_permissions(app_features, requested_permissions))
        base_risk = self.risk_calculator.calculate_risk(requested_permissions, policy_text)["risk_score"]
        recommendations = []
        for perm in requested_permissions:
            if perm not in minimal_set:
                test_perms = [p for p in requested_permissions if p != perm]
                new_risk = self.risk_calculator.calculate_risk(test_perms, policy_text)["risk_score"]
                if new_risk < base_risk:
                    recommendations.append({
                        "permission": perm,
                        "risk_reduction": round(base_risk - new_risk, 2),
                        "remediation": self.risk_calculator._get_remediation_suggestion(perm),
                        "knowledge": self.get_permission_knowledge(perm)
                    })
        return {
            "minimal_permissions": list(minimal_set),
            "unnecessary_permissions": [p for p in requested_permissions if p not in minimal_set],
            "recommendations": recommendations,
            "base_risk": base_risk,
            "knowledge_base": {p: self.get_permission_knowledge(p) for p in requested_permissions},
            "policy_summary": policy_summary or ""
        }

    def get_permission_knowledge(self, permission):
        return PERMISSION_KNOWLEDGE_BASE.get(permission, {})

    def flag_compliance_issues(self, requested_permissions, policy_summary):
        """Flag compliance issues if high-risk permissions are present and policy is weak."""
        issues = []
        for perm in requested_permissions:
            info = PERMISSION_KNOWLEDGE_BASE.get(perm, {})
            if info.get("risk") == "High" and (not policy_summary or "consent" not in policy_summary.lower()):
                issues.append(f"{perm}: High-risk permission with weak/no consent in policy.")
        return issues