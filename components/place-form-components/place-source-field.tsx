'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PlaceSourceFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function PlaceSourceField({
  value = '',
  onChange,
  error,
  className,
  label = 'Data Source',
  placeholder = 'e.g., Google Places, Foursquare, Manual Entry',
}: PlaceSourceFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="place-source" className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>
      <Input
        id="place-source"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(error && 'border-red-500')}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
