import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ScanPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = async (event: React.FormEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.apk')) {
      toast.error('Please upload an APK file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/scan/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze APK');
      }

      const result = await response.json();
      toast.success('APK analysis complete!');
      
      // Store the scan ID in localStorage for the dashboard to fetch (fallback)
      localStorage.setItem('last_scan_id', result.scan_id);
      
      // Navigate to dashboard, passing scan_id directly in state
      navigate('/dashboard', { state: { scanId: result.scan_id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to analyze APK');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Scan Your App</h1>
        
        <div className="space-y-6">
          <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".apk"
              onChange={handleFileChange}
              className="hidden"
              id="apk-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="apk-upload"
              className={`block cursor-pointer ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="text-white mb-4">
                {isUploading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="ml-2">Analyzing...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-lg mb-2">Drag and drop your APK file here</p>
                    <p className="text-sm text-white/70">or click to browse</p>
                  </>
                )}
              </div>
            </label>
          </div>

          <div className="text-white/70 text-sm text-center">
            <p>Supported file type: .apk</p>
            <p>Maximum file size: 16MB</p>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" aria-label="Notifications" />
    </div>
  );
};

export default ScanPage; 