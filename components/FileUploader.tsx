import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { parseHoldingsCSV } from '../utils/csv';
import { Holding } from '../types';

interface FileUploaderProps {
  onHoldingsLoaded: (holdings: Holding[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onHoldingsLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setSuccess(false);

    try {
      const text = await file.text();
      const holdings = parseHoldingsCSV(text);
      
      if (holdings.length === 0) {
        setError('No valid holdings found. Ensure CSV has "Ticker" and "Weight" columns.');
        return;
      }
      
      setSuccess(true);
      onHoldingsLoaded(holdings);
    } catch (err) {
      setError('Failed to parse CSV file.');
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-850 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            Holdings Data
        </h3>
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
            Override
        </button>
      </div>

      <div 
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors
            ${success ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file && fileInputRef.current) {
                // Manually trigger change for simplicity, or create a synthetic event
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInputRef.current.files = dataTransfer.files;
                handleFileChange({ target: { files: dataTransfer.files } } as any);
            }
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden" 
        />
        
        {success ? (
           <div className="flex flex-col items-center text-green-600 dark:text-green-400">
             <CheckCircle className="h-10 w-10 mb-2" />
             <span className="font-medium">{fileName}</span>
             <span className="text-sm mt-1">Holdings loaded successfully</span>
           </div>
        ) : (
           <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
             {error ? <AlertCircle className="h-10 w-10 text-red-500 mb-2" /> : <Upload className="h-10 w-10 mb-2 text-gray-400" />}
             {error ? (
                <span className="text-red-500">{error}</span>
             ) : (
                <>
                    <span className="font-medium">Using Default Repo Data</span>
                    <span className="text-xs mt-1">Click to override with local CSV</span>
                </>
             )}
           </div>
        )}
      </div>
    </div>
  );
};