import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { parseExcelFile, REQUIRED_COLUMN_GUIDE } from '../utils/excelParser';
import { useEmployeeStore } from '../store/useEmployeeStore';

type UploadState = 'idle' | 'dragging' | 'processing' | 'success' | 'error';

export default function UploadArea() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setEmployees = useEmployeeStore(s => s.setEmployees);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrors(['Please upload an Excel file (.xlsx or .xls)']);
      setUploadState('error');
      return;
    }

    setUploadState('processing');
    setErrors([]);
    setWarnings([]);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer);

      if (result.errors.length > 0) {
        setErrors(result.errors);
        setWarnings(result.warnings);
        setUploadState('error');
        return;
      }

      setWarnings(result.warnings);
      setEmployees(result.employees, file.name);
      setUploadState('success');
    } catch (err) {
      setErrors(['An unexpected error occurred while reading the file.']);
      setUploadState('error');
    }
  }, [setEmployees]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('idle');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadState('dragging');
  };

  const handleDragLeave = () => setUploadState('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-uploaded
    if (inputRef.current) inputRef.current.value = '';
  };

  const reset = () => {
    setUploadState('idle');
    setErrors([]);
    setWarnings([]);
  };

  const borderClasses = {
    idle: 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500',
    dragging: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    processing: 'border-blue-400 dark:border-blue-500',
    success: 'border-green-400 dark:border-green-500 bg-green-50/50 dark:bg-green-900/10',
    error: 'border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10',
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop Zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${borderClasses[uploadState]}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => uploadState !== 'processing' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="p-10 flex flex-col items-center gap-4 text-center">
          {uploadState === 'idle' || uploadState === 'dragging' ? (
            <>
              <div className={`p-4 rounded-2xl transition-all ${uploadState === 'dragging'
                  ? 'bg-blue-100 dark:bg-blue-900/40 scale-110'
                  : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                <Upload className={`w-8 h-8 ${uploadState === 'dragging'
                    ? 'text-blue-500'
                    : 'text-gray-400 dark:text-gray-500'
                  }`} />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                  {uploadState === 'dragging' ? 'Drop your file here' : 'Upload your Excel file'}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Drag & drop or{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-medium">browse</span>
                  {' '}· .xlsx files supported
                </p>
              </div>
            </>
          ) : uploadState === 'processing' ? (
            <>
              <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 animate-pulse">
                <FileSpreadsheet className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                Reading file…
              </p>
            </>
          ) : uploadState === 'success' ? (
            <>
              <div className="p-4 rounded-2xl bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-green-700 dark:text-green-400">
                  File loaded successfully!
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Use the search above to explore employees
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-red-700 dark:text-red-400">
                  Upload failed
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Click to try again with a different file
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {errors.map((err, i) => (
                <p key={i} className="text-sm text-red-700 dark:text-red-300">{err}</p>
              ))}
            </div>
            <button onClick={reset} className="text-red-400 hover:text-red-600 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {warnings.map((w, i) => (
                <p key={i} className="text-sm text-yellow-700 dark:text-yellow-300">{w}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Column guide toggle */}
      <div className="mt-4 text-center">
        <button
          onClick={(e) => { e.stopPropagation(); setShowGuide(g => !g); }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showGuide ? 'Hide' : 'Show'} required column format
        </button>
      </div>

      {showGuide && (
        <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Expected Excel columns
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {REQUIRED_COLUMN_GUIDE.map(({ column, description }) => (
              <div key={column} className="px-4 py-2.5 flex items-start gap-3">
                <code className="text-xs bg-gray-100 dark:bg-gray-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono flex-shrink-0">
                  {column}
                </code>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
