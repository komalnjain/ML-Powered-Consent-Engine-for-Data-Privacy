import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiLink, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Scan() {
  const [scanType, setScanType] = useState('apk');
  const [selectedFile, setSelectedFile] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.apk')) {
      setSelectedFile(file);
      setError('');
      setSuccess('');
    } else {
      setSelectedFile(null);
      setError('Please select a valid .apk file.');
    }
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    let endpoint = '';
    let dataToSend;

    if (scanType === 'apk') {
      if (!selectedFile) {
        setError('Please select an APK file to upload.');
        setLoading(false);
        return;
      }
      endpoint = 'http://localhost:5000/api/scan/upload';
      dataToSend = new FormData();
      dataToSend.append('file', selectedFile);
      dataToSend.append('user_id', 'dummy_user_id'); 
    } else {
      if (!url) {
        setError('Please enter a URL to scan.');
        setLoading(false);
        return;
      }
      endpoint = 'http://localhost:5000/api/scan/url';
      dataToSend = { url: url, user_id: 'dummy_user_id' };
    }

    try {
      const response = await axios.post(endpoint, dataToSend, {
        headers: {
          'Content-Type': scanType === 'apk' ? 'multipart/form-data' : 'application/json',
        },
      });

      if (response.data.status === 'success') {
        setSuccess(`${scanType.toUpperCase()} scanned successfully!`);
        if (scanType === 'apk' && response.data.file_path) {
          localStorage.setItem('last_apk_path', response.data.file_path);
        }
        navigate('/dashboard', { state: { scanResult: { ...response.data.data, scan_type: scanType } } });
      } else {
        setError(response.data.error || 'Scan failed for unknown reason.');
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'An error occurred during scan.');
      } else {
        setError('Network error or unexpected issue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Scan Anything</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Choose to upload an APK file or provide a website URL for risk analysis.</p>

        <div className="flex justify-center mb-6">
          <button 
            onClick={() => setScanType('apk')}
            className={`px-4 py-2 rounded-l-lg font-semibold transition-colors
              ${scanType === 'apk' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}
            `}
          >
            <FiUpload className="inline-block mr-2" /> Scan APK
          </button>
          <button 
            onClick={() => setScanType('url')}
            className={`px-4 py-2 rounded-r-lg font-semibold transition-colors
              ${scanType === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}
            `}
          >
            <FiLink className="inline-block mr-2" /> Scan URL
          </button>
        </div>

        {scanType === 'apk' ? (
          <div className="mb-6">
            <label 
              htmlFor="apk-upload"
              className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <FiUpload />
              {selectedFile ? selectedFile.name : 'Choose APK File'}
              <input 
                id="apk-upload"
                type="file" 
                accept=".apk" 
                onChange={handleFileChange} 
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="mb-6">
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

        {(selectedFile || url) && !error && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Selected: {scanType === 'apk' ? selectedFile?.name : url}
          </p>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-4 flex items-center justify-center gap-2"
          >
            <FiAlertCircle />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg mb-4 flex items-center justify-center gap-2"
          >
            <FiCheckCircle />
            {success}
          </motion.div>
        )}

        <motion.button
          onClick={handleSubmit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
            ${(selectedFile || url) && !loading ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}
          `}
          disabled={(!selectedFile && !url) || loading}
        >
          {loading ? 'Scanning...' : `Scan ${scanType === 'apk' ? 'App' : 'URL'}`}
          {loading && <div className="loader ease-linear rounded-full border-2 border-t-2 border-gray-200 h-5 w-5"></div>}
        </motion.button>
      </div>
      {/* Simple spinner for loading state */}
      <style jsx>{`
        .loader {
          border-top-color: #3498db;
          -webkit-animation: spinner 1.5s linear infinite;
          animation: spinner 1.5s linear infinite;
        }

        @-webkit-keyframes spinner {
          0% { -webkit-transform: rotate(0deg); }
          100% { -webkit-transform: rotate(360deg); }
        }

        @keyframes spinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
