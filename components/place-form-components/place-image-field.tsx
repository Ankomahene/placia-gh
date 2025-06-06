'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Upload, X, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface PlaceImageFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
  accept?: string;
  variant?: 'logo' | 'image';
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  isFromUpload: boolean; // Track if current image was uploaded vs URL
  fileName?: string; // Store original filename for deletion
}

export function PlaceImageField({
  value = '',
  onChange,
  error,
  className,
  label = 'Main Image',
  placeholder = 'Enter image URL or upload file',
  accept = 'image/*',
  variant = 'image',
}: PlaceImageFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    isFromUpload: false,
  });

  const getBucketName = () => {
    return variant === 'logo' || label.toLowerCase().includes('logo')
      ? 'logos'
      : 'places-images';
  };

  const getPreviewClasses = () => {
    if (variant === 'logo') {
      return 'w-32 h-32 object-cover'; // Small square for logos
    }
    return 'w-full h-48 object-cover'; // Regular size for images
  };

  const getPreviewContainerClasses = () => {
    if (variant === 'logo') {
      return 'w-32 h-32'; // Small square container for logos
    }
    return 'w-full'; // Full width container for images
  };

  const clearFileInput = () => {
    const fileInput = document.getElementById(
      `${label}-file-input`
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const uploadFileToSupabase = async (file: File) => {
    const supabase = createClient();
    const bucket = getBucketName();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    setUploadState({
      isUploading: true,
      progress: 0,
      isFromUpload: true,
      fileName,
    });

    try {
      // Simulate upload progress since Supabase doesn't provide real-time progress
      const progressInterval = setInterval(() => {
        setUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 15, 90),
        }));
      }, 200);

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      setUploadState((prev) => ({ ...prev, progress: 100 }));

      // Small delay to show completion
      setTimeout(() => {
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          isFromUpload: true,
          fileName,
        }));
        onChange(publicUrl);
        clearFileInput();
        toast.success('Image uploaded successfully!');
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image. Please try again.');
      clearFileInput();
      setUploadState({
        isUploading: false,
        progress: 0,
        isFromUpload: false,
      });
    }
  };

  const deleteFromSupabase = async (fileName: string) => {
    const supabase = createClient();
    const bucket = getBucketName();

    try {
      const { error } = await supabase.storage.from(bucket).remove([fileName]);

      if (error) {
        console.error('Delete failed:', error);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFileToSupabase(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadFileToSupabase(file);
    }
  };

  const clearImage = async () => {
    // If image was uploaded to Supabase, delete it
    if (uploadState.isFromUpload && uploadState.fileName) {
      await deleteFromSupabase(uploadState.fileName);
    }

    onChange('');
    clearFileInput();
    setUploadState({
      isUploading: false,
      progress: 0,
      isFromUpload: false,
    });
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    setUploadState((prev) => ({
      ...prev,
      isFromUpload: false,
      fileName: undefined,
    }));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>

      {/* URL Input - disabled when file is uploaded */}
      {!value && !uploadState.isFromUpload && (
        <div className="flex gap-2">
          <Input
            type="url"
            value={uploadState.isFromUpload ? '' : value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={
              uploadState.isFromUpload
                ? 'File uploaded - delete to use URL'
                : placeholder
            }
            className={cn(error && 'border-red-500')}
            disabled={uploadState.isFromUpload || uploadState.isUploading}
          />
          {(value || uploadState.isFromUpload) && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={clearImage}
              className="shrink-0"
              disabled={uploadState.isUploading}
            >
              {uploadState.isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}

      {/* File Upload Area - only show when no image is present */}
      {!value && !uploadState.isFromUpload && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            uploadState.isUploading && 'pointer-events-none opacity-50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() =>
            !uploadState.isUploading &&
            document.getElementById(`${label}-file-input`)?.click()
          }
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            {uploadState.isUploading
              ? 'Uploading...'
              : 'Drop an image here or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground">
            Supports JPG, PNG, GIF up to 10MB
          </p>
          <input
            id={`${label}-file-input`}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploadState.isUploading}
          />
        </div>
      )}

      {/* Upload Progress */}
      {uploadState.isUploading && (
        <div className="space-y-2">
          <Progress value={uploadState.progress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {Math.round(uploadState.progress)}%
          </p>
        </div>
      )}

      {/* Image Preview */}
      {value && !uploadState.isUploading && (
        <div className={cn('relative group', getPreviewContainerClasses())}>
          <div
            className={cn(
              'border rounded-lg overflow-hidden',
              getPreviewContainerClasses()
            )}
          >
            <img
              src={value}
              alt="Preview"
              className={getPreviewClasses()}
              onError={() => {
                console.error('Failed to load image:', value);
              }}
            />
          </div>
          {uploadState.isFromUpload && (
            <div className="absolute top-2 left-2">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Uploaded
              </span>
            </div>
          )}
          {/* Delete button on hover */}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={clearImage}
            className="absolute -top-2 -right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
