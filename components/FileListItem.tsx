import React from 'react';
import { ProcessedFile, FileUploadStatus } from '../types';
import { SpinnerIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface FileListItemProps {
  item: ProcessedFile;
}

const StatusIndicator: React.FC<{ status: FileUploadStatus }> = ({ status }) => {
  switch (status) {
    case FileUploadStatus.Processing:
      return (
        <div className="flex items-center space-x-2 text-blue-400">
          <SpinnerIcon className="w-5 h-5 animate-spin-slow" />
          <span>Processing...</span>
        </div>
      );
    case FileUploadStatus.Done:
      return (
        <div className="flex items-center space-x-2 text-green-400">
          <CheckCircleIcon className="w-5 h-5" />
          <span>Done</span>
        </div>
      );
    case FileUploadStatus.Error:
      return (
        <div className="flex items-center space-x-2 text-red-400">
          <XCircleIcon className="w-5 h-5" />
          <span>Error</span>
        </div>
      );
    case FileUploadStatus.Queued:
    default:
      return (
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="w-5 h-5 text-center">--</span>
          <span>Queued</span>
        </div>
      );
  }
};

export const FileListItem: React.FC<FileListItemProps> = ({ item }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      <div className="flex-shrink-0 w-full md:w-1/3">
        <div className="aspect-video bg-slate-900 rounded-md flex items-center justify-center overflow-hidden">
          <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-contain" />
        </div>
        <div className="mt-2 text-sm text-slate-400 truncate" title={item.file.name}>{item.file.name}</div>
        <div className="mt-1 text-xs text-slate-500">
          <StatusIndicator status={item.status} />
        </div>
      </div>
      <div className="flex-grow w-full md:w-2/3">
        <div className="h-full bg-slate-900/70 rounded-md p-3">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Extracted Text</h4>
          {item.status === FileUploadStatus.Processing && (
             <div className="w-full h-32 bg-slate-800 rounded-md animate-pulse"></div>
          )}
          {item.status === FileUploadStatus.Done && (
            <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono break-words h-32 overflow-y-auto p-2 bg-slate-800 rounded-md">{item.extractedText}</pre>
          )}
          {item.status === FileUploadStatus.Error && (
            <div className="text-sm text-red-400 h-32 overflow-y-auto p-2 bg-red-900/20 rounded-md">{item.error}</div>
          )}
          {(item.status === FileUploadStatus.Queued) && (
            <div className="text-sm text-slate-500 italic h-32 flex items-center justify-center bg-slate-800 rounded-md">Waiting to be processed...</div>
          )}
        </div>
      </div>
    </div>
  );
};
