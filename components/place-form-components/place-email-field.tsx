'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PlaceEmailFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function PlaceEmailField({
  value = '',
  onChange,
  error,
  className,
  label = 'Email Address',
  placeholder = 'Enter email address',
}: PlaceEmailFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="place-email" className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>
      <Input
        id="place-email"
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(error && 'border-red-500')}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
