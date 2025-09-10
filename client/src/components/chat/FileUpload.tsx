'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  File,
  Image,
  Video,
  Music,
  FileText,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn, formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  roomId: string;
  onFileUploaded: (file: UploadedFile) => void;
  onClose: () => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
};

const getFileColor = (fileType: string) => {
  if (fileType.startsWith('image/')) return 'text-green-500';
  if (fileType.startsWith('video/')) return 'text-blue-500';
  if (fileType.startsWith('audio/')) return 'text-purple-500';
  if (fileType.includes('pdf')) return 'text-red-500';
  return 'text-gray-500';
};

export default function FileUpload({
  roomId,
  onFileUploaded,
  onClose,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB default
  acceptedFileTypes = []
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const reasons = rejectedFiles.map(({ errors }) => 
        errors.map((e: any) => e.message).join(', ')
      );
      setError(`Some files were rejected: ${reasons.join(', ')}`);
    }

    // Process accepted files
    const processedFiles: FileWithPreview[] = acceptedFiles.map((file) => {
      const fileWithPreview = Object.assign(file, {
        id: Math.random().toString(36).substr(2, 9),
        uploadProgress: 0,
        uploadStatus: 'pending' as const,
      });

      // Create preview for images
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      return fileWithPreview;
    });

    setFiles(prev => [...prev, ...processedFiles]);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive: dropzoneIsDragActive,
    open
  } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    maxSize,
    accept: acceptedFileTypes.length > 0 ? {
      ...acceptedFileTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
      }, {} as Record<string, string[]>)
    } : undefined,
    noClick: true,
    noKeyboard: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const uploadFile = async (file: FileWithPreview) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 }
          : f
      ));

      // Simulate upload progress (replace with actual upload progress)
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id && f.uploadProgress! < 90) {
            return { ...f, uploadProgress: f.uploadProgress! + 10 };
          }
          return f;
        }));
      }, 100);

      const uploadedFile = await uploadApi.uploadFile(file, roomId);
      
      clearInterval(progressInterval);

      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, uploadStatus: 'completed', uploadProgress: 100 }
          : f
      ));

      // Notify parent component
      onFileUploaded({
        id: uploadedFile.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: uploadedFile.url,
        thumbnailUrl: uploadedFile.thumbnailUrl,
      });

    } catch (error: any) {
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              uploadStatus: 'failed', 
              error: error.response?.data?.message || 'Upload failed' 
            }
          : f
      ));
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.uploadStatus === 'pending');
    await Promise.all(pendingFiles.map(file => uploadFile(file)));
  };

  const renderFilePreview = (file: FileWithPreview) => {
    const FileIcon = getFileIcon(file.type);
    const fileColor = getFileColor(file.type);
    
    return (
      <div key={file.id} className="relative bg-card border border-border rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className={cn("p-2 bg-muted rounded-lg", fileColor)}>
            <FileIcon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id)}
                className="w-6 h-6 p-0 ml-2 text-muted-foreground hover:text-foreground"
                disabled={file.uploadStatus === 'uploading'}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Progress bar */}
            {file.uploadStatus === 'uploading' && (
              <div className="mt-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${file.uploadProgress || 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Uploading... {file.uploadProgress || 0}%
                </p>
              </div>
            )}
            
            {/* Status indicators */}
            <div className="flex items-center mt-2">
              {file.uploadStatus === 'pending' && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Upload className="w-3 h-3 mr-1" />
                  Ready to upload
                </div>
              )}
              
              {file.uploadStatus === 'completed' && (
                <div className="flex items-center text-xs text-green-600">
                  <Check className="w-3 h-3 mr-1" />
                  Uploaded successfully
                </div>
              )}
              
              {file.uploadStatus === 'failed' && (
                <div className="flex items-center text-xs text-destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {file.error || 'Upload failed'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Image preview */}
        {file.preview && (
          <div className="mt-3">
            <img
              src={file.preview}
              alt={file.name}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}
      </div>
    );
  };

  const pendingFiles = files.filter(f => f.uploadStatus === 'pending');
  const hasFiles = files.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Upload Files</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              (isDragActive || dropzoneIsDragActive)
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">
                  {isDragActive || dropzoneIsDragActive
                    ? "Drop files here..."
                    : "Drag and drop files here"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  or{' '}
                  <button
                    type="button"
                    onClick={open}
                    className="text-primary hover:underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {maxFiles} files, up to {formatFileSize(maxSize)} each
                </p>
              </div>
            </div>
          </div>

          {/* File list */}
          {hasFiles && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  Files to upload ({files.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles([])}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {files.map(renderFilePreview)}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {hasFiles && (
          <div className="flex items-center justify-between p-6 border-t border-border bg-muted/50">
            <p className="text-sm text-muted-foreground">
              {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} ready to upload
            </p>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={uploadAllFiles}
                disabled={pendingFiles.length === 0}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
