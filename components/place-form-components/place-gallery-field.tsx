'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Plus, Upload, X, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';

interface PlaceGalleryFieldProps {
  value?: string[];
  onChange: (value: string[]) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
  maxImages?: number;
}

interface GalleryImage {
  url: string;
  isUploaded: boolean;
  fileName?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadId?: string; // Unique ID for tracking uploads
}

export function PlaceGalleryField({
  value = [],
  onChange,
  error,
  className,
  label = 'Gallery',
  placeholder = 'Enter image URL',
  maxImages = 5,
}: PlaceGalleryFieldProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() =>
    value.map((url) => ({ url, isUploaded: false }))
  );

  const clearFileInput = () => {
    const fileInput = document.getElementById(
      'gallery-file-input'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Update parent when gallery images change
  const updateParent = (images: GalleryImage[]) => {
    const urls = images.filter((img) => !img.isUploading).map((img) => img.url);
    onChange(urls);
  };

  const uploadFileToSupabase = async (file: File, index?: number) => {
    const supabase = createClient();
    const bucket = 'places-images';

    // Generate unique filename and upload ID
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    const newImage: GalleryImage = {
      url: '',
      isUploaded: true,
      fileName,
      isUploading: true,
      uploadProgress: 0,
      uploadId,
    };

    // Use functional setState to avoid race conditions
    setGalleryImages((current) => {
      if (index !== undefined) {
        // Replace existing image
        const updated = [...current];
        updated[index] = newImage;
        return updated;
      } else {
        // Add new image
        return [...current, newImage];
      }
    });

    // Simulate upload progress (real progress tracking would need a different approach)
    const progressInterval = setInterval(() => {
      setGalleryImages((current) => {
        const updated = [...current];
        const imageIndex = updated.findIndex(
          (img) => img.uploadId === uploadId
        );
        if (imageIndex !== -1 && updated[imageIndex]?.isUploading) {
          updated[imageIndex].uploadProgress = Math.min(
            (updated[imageIndex].uploadProgress || 0) + 10,
            90
          );
        }
        return updated;
      });
    }, 200);

    try {
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

      // Update with final URL
      setGalleryImages((current) => {
        const updated = [...current];
        const imageIndex = updated.findIndex(
          (img) => img.uploadId === uploadId
        );
        if (imageIndex !== -1) {
          updated[imageIndex] = {
            url: publicUrl,
            isUploaded: true,
            fileName,
            isUploading: false,
            uploadProgress: 100,
            uploadId, // Keep the uploadId for consistency
          };
        }
        updateParent(updated);
        return updated;
      });

      clearFileInput();
      toast.success('Image uploaded successfully!');
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Upload failed:', error);
      toast.error('Failed to upload image. Please try again.');
      clearFileInput();

      // Remove failed upload
      setGalleryImages((current) => {
        const updated = current.filter((img) => img.uploadId !== uploadId);
        updateParent(updated);
        return updated;
      });
    }
  };

  const deleteFromSupabase = async (fileName: string) => {
    const supabase = createClient();
    const bucket = 'places-images';

    try {
      const { error } = await supabase.storage.from(bucket).remove([fileName]);

      if (error) {
        console.error('Delete failed:', error);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const addImage = () => {
    if (newImageUrl.trim() && galleryImages.length < maxImages) {
      const newImage: GalleryImage = {
        url: newImageUrl.trim(),
        isUploaded: false,
        uploadId: `url-${Date.now()}-${Math.random().toString(36).substring(2)}`, // Unique ID for URL images too
      };
      const updated = [...galleryImages, newImage];
      setGalleryImages(updated);
      updateParent(updated);
      setNewImageUrl('');
    }
  };

  const removeImage = async (index: number) => {
    const image = galleryImages[index];

    // If image was uploaded to Supabase, delete it
    if (image.isUploaded && image.fileName) {
      await deleteFromSupabase(image.fileName);
    }

    const updated = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updated);
    updateParent(updated);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const remainingSlots = maxImages - galleryImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => uploadFileToSupabase(file));
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

    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    const remainingSlots = maxImages - galleryImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => uploadFileToSupabase(file));
  };

  const canAddMore = galleryImages.length < maxImages;
  const hasUploadingImages = galleryImages.some((img) => img.isUploading);

  return (
    <div className={cn('space-y-4', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
        <span className="text-xs text-muted-foreground ml-2">
          {galleryImages.length}/{maxImages}
        </span>
      </Label>

      {/* Add new image URL */}
      {canAddMore && (
        <div className="flex gap-2">
          <Input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addImage();
              }
            }}
            disabled={hasUploadingImages}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addImage}
            disabled={!newImageUrl.trim() || !canAddMore || hasUploadingImages}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* File Upload Area */}
      {canAddMore && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            hasUploadingImages && 'pointer-events-none opacity-50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() =>
            !hasUploadingImages &&
            document.getElementById('gallery-file-input')?.click()
          }
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            {hasUploadingImages
              ? 'Uploading...'
              : 'Drop images here or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground">
            {maxImages - galleryImages.length} slots remaining
          </p>
          <input
            id="gallery-file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={hasUploadingImages}
          />
        </div>
      )}

      {/* Gallery Grid */}
      {galleryImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={image.uploadId || image.url || index}
              className="relative group"
            >
              <div className="border rounded-lg overflow-hidden aspect-square">
                {image.isUploading ? (
                  <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-2" />
                    <Progress
                      value={image.uploadProgress || 0}
                      className="w-3/4 mb-2"
                    />
                    <span className="text-xs text-gray-500">
                      {Math.round(image.uploadProgress || 0)}%
                    </span>
                  </div>
                ) : (
                  <Image
                    src={image.url}
                    alt={`Gallery image ${index + 1}`}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.error('Failed to load image:', image.url);
                    }}
                  />
                )}
              </div>

              {!image.isUploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}

              {/* Upload indicator */}
              {image.isUploaded && !image.isUploading && (
                <div className="absolute top-2 left-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Uploaded
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
