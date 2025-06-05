'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PlaceNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function PlaceNameField({
  value,
  onChange,
  error,
  required = true,
  className,
  label = 'Place Name',
  placeholder = 'Enter place name',
}: PlaceNameFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="place-name" className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id="place-name"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(error && 'border-red-500')}
        required={required}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
