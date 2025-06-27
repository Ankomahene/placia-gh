'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PlaceTaglineFieldProps {
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
}

export function PlaceTaglineField({
  value = '',
  onChange,
  error,
  className,
  label = 'Tagline',
  placeholder = 'Enter a catchy tagline (optional)',
  maxLength = 100,
}: PlaceTaglineFieldProps) {
  // Ensure value is always a string
  const safeValue = value || '';

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="place-tagline" className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>
      <Input
        id="place-tagline"
        type="text"
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(error && 'border-red-500')}
        maxLength={maxLength}
      />
      <div className="flex justify-between items-center">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <p className="text-xs text-muted-foreground ml-auto">
          {safeValue.length}/{maxLength}
        </p>
      </div>
    </div>
  );
}
