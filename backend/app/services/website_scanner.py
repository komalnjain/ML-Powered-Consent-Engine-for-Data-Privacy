import requests
import os
from datetime import datetime
from bs4 import BeautifulSoup # Import BeautifulSoup for HTML parsing
from app.models.app_scan import AppScan # Reusing AppScan model for storage

class WebsiteScanner:
    def __init__(self, mongo):
        self.mongo = mongo # Store the mongo object
        # We can add more sophisticated tools here later
        pass

    def scan_website(self, url, user_id):
        """
        Scans a given website URL and returns a risk assessment.
        For simplicity, this is a placeholder with heuristic-based risk.
        """
        features = {
            'url': url,
            'status_code': None,
            'has_ssl': False,
            'common_trackers_detected': [],
            'privacy_policy_keywords_detected': False,
            'response_time_ms': None,
            'security_headers': {}, # New feature
            'external_scripts_count': 0, # New feature
            'iframe_count': 0, # New feature
            'form_count': 0, # New feature
            'potential_js_obfuscation': False, # New feature
        }
        risk_score = 0.0

        try:
            start_time = datetime.now()
            response = requests.get(url, timeout=10) # Add a timeout
            end_time = datetime.now()

            features['status_code'] = response.status_code
            features['response_time_ms'] = (end_time - start_time).total_seconds() * 1000
            features['has_ssl'] = url.startswith('https://')
            
            # Extract security headers
            security_headers = [
                'Content-Security-Policy',
                'X-XSS-Protection',
                'X-Frame-Options',
                'Strict-Transport-Security',
                'Referrer-Policy',
                'Permissions-Policy'
            ]
            for header in security_headers:
                features['security_headers'][header] = response.headers.get(header, 'N/A')
                if response.headers.get(header) == 'N/A':
                    risk_score += 0.5 # Slight penalty for missing security headers

            # Simple heuristic for risk score based on status code and SSL
            if response.status_code >= 400 or not features['has_ssl']:
                risk_score += 5.0

            # Parse HTML content
            soup = BeautifulSoup(response.text, 'html.parser')

            # Placeholder for tracker detection
            if 'google-analytics.com' in response.text:
                features['common_trackers_detected'].append('Google Analytics')
                risk_score += 1.0
            if 'facebook.com/tr' in response.text: # Facebook pixel
                features['common_trackers_detected'].append('Facebook Pixel')
                risk_score += 1.0
            
            # Count external scripts
            for script in soup.find_all('script', src=True):
                if script['src'].startswith('http') or script['src'].startswith('//'):
                    features['external_scripts_count'] += 1
                    risk_score += 0.2 # Slight penalty for external scripts

            # Count iframes
            features['iframe_count'] = len(soup.find_all('iframe'))
            if features['iframe_count'] > 0:
                risk_score += 1.0 # Penalty for iframes

            # Count forms
            features['form_count'] = len(soup.find_all('form'))
            if features['form_count'] > 0:
                risk_score += 0.5 # Slight penalty for forms (potential data collection)

            # Basic heuristic for potential JavaScript obfuscation
            for script in soup.find_all('script', string=True):
                if len(script.string) > 500 and ('eval(' in script.string or 'unescape(' in script.string):
                    features['potential_js_obfuscation'] = True
                    risk_score += 2.0 # Higher penalty for suspected obfuscation
                    break # Only need to find one instance

            # Placeholder for privacy policy keywords
            privacy_keywords = ['privacy policy', 'data protection', 'terms of service']
            if any(keyword in response.text.lower() for keyword in privacy_keywords):
                features['privacy_policy_keywords_detected'] = True
            else:
                risk_score += 2.0 # Higher risk if no privacy policy keywords found

        except requests.exceptions.Timeout:
            risk_score += 3.0
            features['error'] = 'Request timed out.'
        except requests.exceptions.RequestException as e:
            risk_score += 4.0
            features['error'] = f'Network error: {str(e)}'
        except Exception as e:
            risk_score += 5.0
            features['error'] = f'Unexpected error during scan: {str(e)}'
        
        # Clamp risk score between 0 and 10
        risk_score = max(0, min(10, risk_score))

        scan_data = {
            'user_id': user_id,
            'features': features,
            'risk_score': risk_score,
            'timestamp': datetime.utcnow(),
            'scan_type': 'url',
        }
        
        # Save result using AppScan model
        # For website scans, app_name will be the URL and permissions will be an empty list
        AppScan(self.mongo).log_scan(
            user_id=user_id,
            app_name=url,
            risk_score=risk_score,
            permissions=[] # Permissions are not directly applicable to website static analysis
        )

        return {
            'risk_score': risk_score,
            'features': features
        } 