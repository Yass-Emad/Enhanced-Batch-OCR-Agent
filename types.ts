export enum FileUploadStatus {
  Queued = 'Queued',
  Processing = 'Processing',
  Done = 'Done',
  Error = 'Error',
}

export interface ProcessedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: FileUploadStatus;
  extractedText?: string;
  error?: string;
}
