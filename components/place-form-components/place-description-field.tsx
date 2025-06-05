'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PlaceDescriptionFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  required?: boolean;
}

export function PlaceDescriptionField({
  value = '',
  onChange,
  error,
  className,
  label = 'Description',
  placeholder = 'Describe this place, its features, and what makes it special...',
  maxLength = 1000,
  rows = 6,
  required = false,
}: PlaceDescriptionFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="place-description" className="text-sm font-medium">
        {label}
        {required ? (
          <span className="text-red-500 ml-1">*</span>
        ) : (
          <span className="text-muted-foreground ml-1">(Optional)</span>
        )}
      </Label>
      <Textarea
        id="place-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(error && 'border-red-500')}
        maxLength={maxLength}
        rows={rows}
      />
      <div className="flex justify-between items-center">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <p className="text-xs text-muted-foreground ml-auto">
          {value.length}/{maxLength}
        </p>
      </div>
    </div>
  );
}
