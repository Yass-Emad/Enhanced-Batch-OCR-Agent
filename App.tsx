import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { FileListItem } from './components/FileListItem';
import { ProcessedFile, FileUploadStatus } from './types';
import { getTextFromImage } from './services/geminiService';

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFilesSelect = (selectedFiles: File[]) => {
    const newProcessedFiles: ProcessedFile[] = selectedFiles.map(file => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: FileUploadStatus.Queued,
    }));
    setFiles(prevFiles => [...prevFiles, ...newProcessedFiles]);
  };
  
  const processQueue = useCallback(async () => {
    const queuedFile = files.find(f => f.status === FileUploadStatus.Queued);
    if (!queuedFile) {
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true);

    setFiles(prev => prev.map(f => f.id === queuedFile.id ? { ...f, status: FileUploadStatus.Processing } : f));

    try {
      const text = await getTextFromImage(queuedFile.file);
      setFiles(prev => prev.map(f => f.id === queuedFile.id ? { ...f, status: FileUploadStatus.Done, extractedText: text } : f));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setFiles(prev => prev.map(f => f.id === queuedFile.id ? { ...f, status: FileUploadStatus.Error, error: errorMessage } : f));
    }
  }, [files]);
  
  useEffect(() => {
    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    };
  }, [files]);

  const clearAll = () => {
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
            Enhanced Batch OCR Agent
          </h1>
          <p className="mt-2 text-slate-400">
            Upload multiple images and let AI extract the text for you.
          </p>
        </header>

        <section className="mb-8">
          <FileUpload onFilesSelect={handleFilesSelect} isProcessing={isProcessing} />
        </section>

        {files.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Processing Queue</h2>
              <button
                onClick={clearAll}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium bg-red-600/50 hover:bg-red-600/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-4">
              {files.map(item => (
                <FileListItem key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
        
        {files.length === 0 && (
            <div className="text-center py-16 px-6 border-2 border-dashed border-slate-700 rounded-xl">
                <h3 className="text-xl font-medium text-slate-300">Your results will appear here</h3>
                <p className="text-slate-500 mt-2">Get started by uploading some image files.</p>
            </div>
        )}
      </main>
      <footer className="text-center p-4 text-xs text-slate-600">
        <p>Built by a world-class senior frontend React engineer.</p>
      </footer>
    </div>
  );
};

export default App;
