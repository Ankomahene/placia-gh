'use client';

import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/ui/icon-picker';
import { cn } from '@/lib/utils';

interface PlaceIconFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  allowCustom?: boolean;
}

export function PlaceIconField({
  value = '',
  onChange,
  error,
  className,
  label = 'Icon',
  allowCustom = true,
}: PlaceIconFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>
      <IconPicker
        value={value}
        onChange={onChange}
        allowCustom={allowCustom}
        className={cn(error && 'border-red-500')}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
