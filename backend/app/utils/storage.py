import os
from werkzeug.utils import secure_filename
from androguard.core.bytecodes.apk import APK
from androguard.core.bytecodes.dvm import DalvikVMFormat

def save_file(file, upload_folder):
    """
    Save an uploaded file to the specified upload folder.
    
    Args:
        file: The file object to save.
        upload_folder: The directory where the file should be saved.
        
    Returns:
        str: The full path of the saved file.
    """
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)
    
    return file_path

def analyze_apk(apk_path):
    apk = APK(apk_path)
    all_classes = []
    try:
        dex_files = list(apk.get_all_dex())
        if not dex_files:
            return {"error": "No DEX files found in APK."}
        for dex in dex_files:
            dvm = DalvikVMFormat(dex)
            # get_classes returns a list of ClassDefItem objects, get their names:
            classes = [c.get_name() for c in dvm.get_classes()]
            all_classes.extend(classes)
        return {"classes": all_classes}
    except Exception as e:
        return {"error": f"APK analysis failed: {str(e)}"}

# Example usage (for testing only, remove in production)
# if __name__ == "__main__":
#     apk_path = "path/to/your.apk"
#     classes = analyze_apk(apk_path)
#     print(classes)
