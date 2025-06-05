'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Upload, X, Plus, Image as ImageIcon } from 'lucide-react';

interface PlaceGalleryFieldProps {
  value?: string[];
  onChange: (value: string[]) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
  maxImages?: number;
}

export function PlaceGalleryField({
  value = [],
  onChange,
  error,
  className,
  label = 'Gallery',
  placeholder = 'Enter image URL',
  maxImages = 10,
}: PlaceGalleryFieldProps) {
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const addImage = () => {
    if (newImageUrl.trim() && value.length < maxImages) {
      onChange([...value, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, newUrl: string) => {
    const updated = [...value];
    updated[index] = newUrl;
    onChange(updated);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const remainingSlots = maxImages - value.length;
    const filesToProcess = files.slice(0, remainingSlots);

    const newUrls = filesToProcess.map((file) => URL.createObjectURL(file));
    onChange([...value, ...newUrls]);
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

    const remainingSlots = maxImages - value.length;
    const filesToProcess = files.slice(0, remainingSlots);
    const newUrls = filesToProcess.map((file) => URL.createObjectURL(file));

    onChange([...value, ...newUrls]);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
        <span className="text-xs text-muted-foreground ml-2">
          {value.length}/{maxImages}
        </span>
      </Label>

      {/* Add new image URL */}
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
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addImage}
          disabled={!newImageUrl.trim() || value.length >= maxImages}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* File Upload Area */}
      {value.length < maxImages && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('gallery-file-input')?.click()}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            Drop images here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            {maxImages - value.length} slots remaining
          </p>
          <input
            id="gallery-file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Gallery Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="border rounded-lg overflow-hidden aspect-square">
                <img
                  src={imageUrl}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.error('Failed to load image:', imageUrl);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>

              {/* URL Editor */}
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => updateImage(index, e.target.value)}
                className="mt-2 text-xs"
                placeholder="Image URL"
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
