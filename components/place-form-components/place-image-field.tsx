'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface PlaceImageFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
  accept?: string;
}

export function PlaceImageField({
  value = '',
  onChange,
  error,
  className,
  label = 'Main Image',
  placeholder = 'Enter image URL or upload file',
  accept = 'image/*',
}: PlaceImageFieldProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload this file to your storage service
      // For now, we'll create a temporary URL
      const url = URL.createObjectURL(file);
      onChange(url);
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
      const url = URL.createObjectURL(file);
      onChange(url);
    }
  };

  const clearImage = () => {
    onChange('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>

      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(error && 'border-red-500')}
        />
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={clearImage}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* File Upload Area */}
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
        onClick={() => document.getElementById(`${label}-file-input`)?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          Drop an image here or click to browse
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
        />
      </div>

      {/* Image Preview */}
      {value && (
        <div className="relative">
          <div className="border rounded-lg overflow-hidden">
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-cover"
              onError={() => {
                // Handle broken image URLs
                console.error('Failed to load image:', value);
              }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
