import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiAlertTriangle } from 'react-icons/fi';
import { ScanResult } from '../../api/types';

interface AppUploaderProps {
    onScanComplete: (result: ScanResult) => void;
}

export default function AppUploader({ onScanComplete }: AppUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpload = async (file: File) => {
        if (!file) return;
        
        setIsLoading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/scan/analyze', {
                method: 'POST',
                body: formData
            });
            
            const data: ScanResult = await response.json();
            if (response.ok) {
                onScanComplete(data); 
            } else {
                throw new Error(data.message || 'Scan failed');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 text-center"
        >
            <div 
                className={`border-2 border-dashed rounded-xl p-12 transition-all ${
                    isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300'
                }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files[0]) {
                        handleUpload(e.dataTransfer.files[0]);
                    }
                }}
            >
                <FiUpload className="mx-auto text-4xl text-blue-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                    {isLoading ? 'Analyzing APK...' : 'Drag & Drop APK Here'}
                </h3>
                <p className="text-gray-500 mb-4">
                    Or click to browse files
                </p>
                <input
                    type="file"
                    id="apk-upload"
                    accept=".apk"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            handleUpload(e.target.files[0]);
                        }
                    }}
                />
                <motion.label
                    htmlFor="apk-upload"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer"
                >
                    Select APK
                </motion.label>
                
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center justify-center text-red-500"
                    >
                        <FiAlertTriangle className="mr-2" />
                        {error}
                    </motion.div>
                )}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
                <p>We'll analyze permissions, trackers, and code patterns</p>
                <p>Typical scan time: 5-15 seconds</p>
            </div>
        </motion.div>
    );
}