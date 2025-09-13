from flask import Blueprint, request, jsonify, current_app, send_file
import os
from app.utils.storage import save_file
from app.services.website_scanner import WebsiteScanner
from app import mongo
from androguard.core.bytecodes.apk import APK
from androguard.core.bytecodes.dvm import DalvikVMFormat
from androguard.core.analysis.analysis import Analysis
from app.services.scanner import APKScanner
from app.models.app_scan import AppScan
from werkzeug.utils import secure_filename
from flask import session
from datetime import datetime
from ..ml.policy_analyzer import PolicyAnalyzer
from typing import Dict
from app.services.risk_calculator import PermissionOptimizer, RiskCalculator
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
from socketio_instance import socketio

bp = Blueprint('scan', __name__, url_prefix='/api/scan')
website_scanner = WebsiteScanner(None)  # MongoDB instance not needed for basic scan
apk_scanner = APKScanner(None)  # MongoDB instance not needed for basic scan
policy_analyzer = PolicyAnalyzer()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@bp.route('/upload', methods=['POST'])
def upload_apk():
    if 'file' not in request.files:
        return jsonify({'error': 'No APK uploaded'}), 400
    file = request.files['file']
    if not file.filename.endswith('.apk'):
        return jsonify({'error': 'Invalid file type'}), 400
    try:
        apk_path = save_file(file, 'uploads')
        return jsonify({'status': 'success', 'file_path': apk_path})
    except Exception as e:
        return jsonify({'error': f'File save failed: {str(e)}'}), 500

@bp.route('/analyze', methods=['POST'])
def analyze_apk():
    """Analyze an APK file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if not file.filename:
            return jsonify({'error': 'No file selected'}), 400
        
        # Save the uploaded file
        file_path = save_file(file, 'uploads')
        
        # Analyze the APK and log the scan
        user_id = session.get('user_id', 'anonymous')
        app_name = file.filename
        apk_scanner_with_mongo = APKScanner(mongo)
        results = apk_scanner_with_mongo.scan_apk(file_path, user_id=user_id, app_name=app_name)
        if not results or (isinstance(results, dict) and 'error' in results):
            return jsonify({'error': results.get('error', 'Failed to analyze APK')}), 400
        # Emit real-time notification
        if 'scan_id' in results:
            print(f"Emitting scan_complete for user_id={user_id}, scan_id={results.get('scan_id')}")
            socketio.emit('scan_complete', {
                'user_id': user_id,
                'scan_id': results['scan_id'],
                'risk_score': results.get('risk_score'),
                'app_name': app_name
            }, room=user_id)
        return jsonify(results), 200
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@bp.route('/url', methods=['POST', 'OPTIONS'])
def scan_url():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    data = request.get_json()
    url = data.get('url')
    user_id = data.get('user_id', 'dummy_user_id')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    try:
        result = website_scanner.scan_website(url, user_id)
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/test-risk-prediction', methods=['GET'])
def test_risk_prediction():
    try:
        risk_calculator = RiskCalculator()
        test_results = risk_calculator.test_risk_prediction()
        return jsonify(test_results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/results/<scan_id>', methods=['GET'])
def get_scan_result(scan_id):
    """Retrieve a specific scan result by ID"""
    try:
        # Ensure AppScan is initialized with mongo for get_scan_by_id
        app_scan_instance = AppScan(mongo)
        scan_data = app_scan_instance.get_scan_by_id(scan_id)
        if not scan_data:
            return jsonify({'error': 'Scan result not found'}), 404
        
        # Convert ObjectId to string for JSON serialization
        scan_data['_id'] = str(scan_data['_id'])
        # user_id might be ObjectId in MongoDB, ensure it's string for JSON
        if 'user_id' in scan_data: scan_data['user_id'] = str(scan_data['user_id'])

        # Ensure all necessary fields are present, even if empty
        categories = scan_data.get('categories', {})
        critical_items = scan_data.get('critical_items', [])
        permissions = scan_data.get('permissions', [])

        return jsonify({
            'status': 'success',
            'scan_id': scan_data['_id'],
            'risk_score': scan_data['risk_score'],
            'categories': categories,
            'critical_items': critical_items,
            'permissions': permissions 
        })
    except Exception as e:
        print(f"[ERROR] Failed to retrieve scan result: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/analyze-policy', methods=['POST'])
def analyze_policy():
    """Analyze privacy policy text"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        if 'text' not in data:
            return jsonify({'error': 'Policy text is required'}), 400
            
        # Analyze the policy text
        analysis_results = policy_analyzer.analyze_policy(data['text'])
        return jsonify(analysis_results), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/optimize-permissions', methods=['POST'])
def optimize_permissions():
    data = request.get_json()
    app_features = data.get('features', [])
    requested_permissions = data.get('permissions', [])
    policy_text = data.get('policy_text', '')
    policy_summary = data.get('policy_summary', '')

    optimizer = PermissionOptimizer()
    result = optimizer.optimize_permissions(app_features, requested_permissions, policy_text, policy_summary)
    result['current_permissions'] = requested_permissions
    return jsonify(result)

@bp.route('/analyze-url', methods=['POST', 'OPTIONS'])
def analyze_url():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    import re
    from urllib.parse import urlparse, parse_qs
    import math

    # Knowledge base
    SUSPICIOUS_KEYWORDS = [
        'login', 'secure', 'update', 'verify', 'account', 'bank', 'confirm', 'signin', 'wp-admin', 'reset', 'pay', 'ebay', 'paypal', 'webscr', 'password', 'token', 'auth', 'shell', 'cmd', 'upload', 'admin'
    ]
    SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work', '.support', '.info', '.ru', '.cn']
    SHORTENERS = ['bit.ly', 'goo.gl', 'tinyurl.com', 't.co', 'ow.ly', 'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'cutt.ly']
    BLACKLISTED_DOMAINS = ['malware.test', 'phishing.test', 'badsite.com', 'examplebad.com']
    OBFUSCATION_PATTERNS = ['%2e', '%2f', '%5c', '@', 'xn--']
    RISKY_EXTENSIONS = ['.exe', '.scr', '.zip', '.js', '.php', '.bat', '.cmd', '.jar', '.vbs', '.ps1']

    def calculate_entropy(s):
        """Shannon entropy calculation for a string"""
        prob = [ float(s.count(c)) / len(s) for c in set(s) ]
        entropy = - sum([ p * math.log2(p) for p in prob ])
        return entropy

    # Parse URL
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        query = parsed.query.lower()
    except Exception:
        return jsonify({'error': 'Invalid URL'}), 400

    risk_score = 1.0
    risk_level = 'low'
    details = []

    # 1. HTTPS check
    if not url.lower().startswith('https://'):
        risk_score += 3
        details.append('URL is not using HTTPS')

    # 2. Suspicious keywords
    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in url.lower():
            risk_score += 2
            details.append(f"Suspicious keyword detected: '{keyword}'")
            break

    # 3. URL length
    if len(url) < 15:
        risk_score += 1
        details.append('URL is very short (suspicious)')
    elif len(url) > 60:
        risk_score += 1
        details.append('URL is very long (possible obfuscation)')

    # 4. TLD and domain issues
    for tld in SUSPICIOUS_TLDS:
        if domain.endswith(tld):
            risk_score += 2
            details.append(f"Suspicious TLD detected: {tld}")
            break

    for shortener in SHORTENERS:
        if shortener in domain:
            risk_score += 2
            details.append(f"URL uses shortening service: {shortener}")
            break

    for bad in BLACKLISTED_DOMAINS:
        if bad in domain:
            risk_score += 5
            details.append("Domain is in blacklist")
            break

    # 5. Obfuscation check
    if any(p in url.lower() for p in OBFUSCATION_PATTERNS):
        risk_score += 2
        details.append('URL appears obfuscated')

    # 6. Double domain trick
    if re.search(r'\.\w+\.\w+\.', domain):
        risk_score += 1
        details.append('Domain may contain deceptive multiple subdomains')

    # 7. Risky file extensions
    if any(url.lower().endswith(ext) for ext in RISKY_EXTENSIONS):
        risk_score += 3
        details.append(f"URL ends with risky file type")

    # 8. Sensitive data in query
    if 'password' in query or 'token' in query or 'auth' in query:
        risk_score += 3
        details.append('URL query contains possible credentials')

    # 9. Risky path patterns
    if any(x in path for x in ['admin', 'upload', 'shell', 'cmd']):
        risk_score += 2
        details.append('Suspicious path segment detected')

    # 10. High entropy string
    entropy = calculate_entropy(url)
    if entropy > 4.5:
        risk_score += 1
        details.append(f"High URL entropy ({round(entropy, 2)}) indicates obfuscation")

    # Final risk level
    if risk_score >= 8:
        risk_level = 'high'
    elif risk_score >= 4:
        risk_level = 'medium'

    return jsonify({
        'url': url,
        'domain': domain,
        'risk_score': round(risk_score, 2),
        'risk_level': risk_level,
        'details': details or ['No major risks detected']
    })

@bp.route('/download-report/<scan_id>', methods=['GET'])
def download_report(scan_id):
    """Generate and download a PDF report for a scan result by ID"""
    try:
        app_scan_instance = AppScan(mongo)
        scan_data = app_scan_instance.get_scan_by_id(scan_id)
        if not scan_data:
            return jsonify({'error': 'Scan result not found'}), 404

        # Prepare PDF in memory
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 40
        p.setFont("Helvetica-Bold", 16)
        p.drawString(40, y, f"Scan Report: {scan_data.get('app_name', 'Unknown App')}")
        y -= 30
        p.setFont("Helvetica", 12)
        p.drawString(40, y, f"Scan ID: {str(scan_data.get('_id', ''))}")
        y -= 20
        p.drawString(40, y, f"Risk Score: {scan_data.get('risk_score', 'N/A')}")
        y -= 20
        p.drawString(40, y, f"Timestamp: {scan_data.get('timestamp', '')}")
        y -= 30
        p.setFont("Helvetica-Bold", 14)
        p.drawString(40, y, "Categories:")
        y -= 20
        p.setFont("Helvetica", 12)
        for cat, score in (scan_data.get('categories', {}) or {}).items():
            p.drawString(60, y, f"{cat}: {score}")
            y -= 18
            if y < 60:
                p.showPage()
                y = height - 40
        y -= 10
        p.setFont("Helvetica-Bold", 14)
        p.drawString(40, y, "Critical Items:")
        y -= 20
        p.setFont("Helvetica", 12)
        for item in (scan_data.get('critical_items', []) or []):
            p.drawString(60, y, f"- {item}")
            y -= 18
            if y < 60:
                p.showPage()
                y = height - 40
        y -= 10
        p.setFont("Helvetica-Bold", 14)
        p.drawString(40, y, "Permissions:")
        y -= 20
        p.setFont("Helvetica", 12)
        for perm in (scan_data.get('permissions', []) or []):
            if isinstance(perm, dict):
                name = perm.get('name', str(perm))
            else:
                name = str(perm)
            p.drawString(60, y, f"- {name}")
            y -= 18
            if y < 60:
                p.showPage()
                y = height - 40
        p.save()
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"scan_report_{scan_id}.pdf", mimetype='application/pdf')
    except Exception as e:
        print(f"[ERROR] Failed to generate PDF report: {str(e)}")
        return jsonify({'error': str(e)}), 500

@socketio.on('join')
def on_join(data):
    user_id = data.get('user_id')
    if user_id:
        from flask_socketio import join_room
        join_room(user_id) 