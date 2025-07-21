import React, { useCallback, useState, useRef } from 'react';
import { cn } from '@/utils/cn';
import {
  validateImageFile,
  createImagePreview,
  cleanupImagePreview,
  getImageInfo,
} from '@/utils/image-utils';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  label: string;
  preview?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  label,
  preview = true,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    width: number;
    height: number;
    size: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    async (file: File): Promise<boolean> => {
      setError(null);

      // Use the utility function for validation
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const validation = validateImageFile(file, maxSizeMB);

      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return false;
      }

      // Get image info for logging
      try {
        const info = await getImageInfo(file);
        setImageInfo(info);
      } catch (error) {
        console.warn('Failed to get image info:', error);
      }

      return true;
    },
    [maxSize],
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      const isValid = await validateFile(file);
      if (isValid) {
        setSelectedFile(file);
        onFileSelect(file);

        if (preview) {
          const url = createImagePreview(file);
          setPreviewUrl(url);
        }
      } else {
        onFileSelect(null);
      }
    },
    [validateFile, onFileSelect, preview],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleClick = useCallback(() => {
    if (!selectedFile) {
      fileInputRef.current?.click();
    }
  }, [selectedFile]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setImageInfo(null);
    setError(null);
    onFileSelect(null);

    if (previewUrl) {
      cleanupImagePreview(previewUrl);
      setPreviewUrl(null);
    }
  }, [onFileSelect, previewUrl]);

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">{label}</label>

      <div
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors',
          'hover:border-primary/50 hover:bg-muted/50',
          isDragOver && 'border-primary bg-primary/5',
          error && 'border-destructive',
          'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2 focus-within:outline-none',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="mx-auto max-h-32 rounded object-cover"
            />
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                {selectedFile?.name}
              </p>
              {imageInfo && (
                <p className="text-muted-foreground text-xs">
                  {imageInfo.width}×{imageInfo.height} • {imageInfo.size}
                </p>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="text-destructive text-xs hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-muted-foreground mx-auto h-12 w-12">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-full w-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-muted-foreground text-xs">
              JPEG, PNG, WebP up to {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
