'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Plus, Upload, X, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';

interface PlaceGalleryFieldProps {
  value?: string[] | null;
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
  // Ensure value is always an array
  const galleryUrls = value || [];

  const [newImageUrl, setNewImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() =>
    galleryUrls.map((url) => ({ url, isUploaded: false }))
  );

  // Update gallery images when value prop changes, but only when the arrays are actually different
  useEffect(() => {
    const urls = galleryUrls || [];
    const currentUrls = galleryImages
      .filter((img) => !img.isUploading)
      .map((img) => img.url);

    // Only update if the arrays are different in content or length
    if (
      urls.length !== currentUrls.length ||
      !urls.every((url, i) => url === currentUrls[i])
    ) {
      setGalleryImages(urls.map((url) => ({ url, isUploaded: false })));
    }
  }, [galleryUrls]);

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
    if (event.target.files && event.target.files.length > 0) {
      if (galleryImages.length < maxImages) {
        uploadFileToSupabase(event.target.files[0]);
      } else {
        toast.error(`Maximum ${maxImages} images allowed`);
      }
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

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      if (galleryImages.length < maxImages) {
        uploadFileToSupabase(event.dataTransfer.files[0]);
      } else {
        toast.error(`Maximum ${maxImages} images allowed`);
      }
    }
  };

  const canAddMore = galleryImages.length < maxImages;
  const hasUploadingImages = galleryImages.some((img) => img.isUploading);

  return (
    <div className={cn('space-y-4', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
        <span className="text-xs text-muted-foreground ml-2">
          {galleryImages.filter((img) => !img.isUploading).length}/{maxImages}
        </span>
      </Label>

      {/* Gallery grid */}
      {galleryImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={image.uploadId || `gallery-${index}`}
              className="relative aspect-square rounded-md overflow-hidden border"
            >
              {image.isUploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <Progress
                    value={image.uploadProgress}
                    className="w-full h-1"
                  />
                  <p className="text-xs text-center mt-2">Uploading...</p>
                </div>
              ) : (
                <>
                  <Image
                    src={image.url}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add image form */}
      {galleryImages.length < maxImages && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder={placeholder}
              className={cn(error && 'border-red-500')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newImageUrl.trim()) {
                  e.preventDefault();
                  addImage();
                }
              }}
            />
            <Button
              type="button"
              onClick={addImage}
              disabled={!newImageUrl.trim()}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>

          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center',
              isDragging && 'border-primary bg-primary/5',
              error && 'border-red-500'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">
                Drag and drop image here
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supports: JPG, PNG, GIF (max 5MB)
              </p>
              <Input
                id="gallery-file-input"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  document.getElementById('gallery-file-input')?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
