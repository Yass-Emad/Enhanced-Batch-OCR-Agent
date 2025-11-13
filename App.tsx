import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { FileListItem } from './components/FileListItem';
import { ProcessedFile, FileUploadStatus } from './types';
import { getTextFromImage } from './services/geminiService';
import { ClipboardIcon, DownloadIcon } from './components/icons';

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

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

  const aggregatedText = React.useMemo(() => {
    return files
      .filter(f => f.status === FileUploadStatus.Done && f.extractedText)
      .map(f => `--- Start of ${f.file.name} ---\n\n${f.extractedText}\n\n--- End of ${f.file.name} ---\n`)
      .join('\n');
  }, [files]);

  const handleCopy = useCallback(() => {
    if (!aggregatedText) return;
    navigator.clipboard.writeText(aggregatedText).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy text to clipboard.');
    });
  }, [aggregatedText]);

  const handleDownload = useCallback(() => {
    if (!aggregatedText) return;
    const blob = new Blob([aggregatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ocr-results.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [aggregatedText]);

  const hasCompletedFiles = files.some(f => f.status === FileUploadStatus.Done);

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
        
        {hasCompletedFiles && (
          <section className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Aggregated Results</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 rounded-md transition-colors flex items-center space-x-2"
                >
                  <ClipboardIcon className="w-4 h-4" />
                  <span>{copyStatus === 'copied' ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-2 text-sm font-medium bg-brand-primary/80 hover:bg-brand-primary rounded-md transition-colors flex items-center space-x-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono break-words h-96 overflow-y-auto p-2 bg-slate-900/70 rounded-md">
                {aggregatedText || 'Successfully processed text will appear here...'}
              </pre>
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
