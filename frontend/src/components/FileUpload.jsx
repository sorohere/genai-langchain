import React, { useCallback } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

const FileUpload = ({ onUpload, isDark, isLoading }) => {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUpload(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            onUpload(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto p-6">
            <label
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${isDark
                        ? 'border-gray-700 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-500'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                    }`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                        <UploadCloud className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                    </div>
                    <p className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        CSV files only (max 10MB)
                    </p>
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isLoading}
                />
            </label>

            {isLoading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-500">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Uploading and analyzing...
                </div>
            )}
        </div>
    );
};

export default FileUpload;
