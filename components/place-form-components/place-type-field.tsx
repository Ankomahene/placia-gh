'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { cn } from '@/lib/utils';

interface PlaceType {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface PlaceTypeFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  types?: PlaceType[];
  loading?: boolean;
  disabled?: boolean;
}

export function PlaceTypeField({
  value = '',
  onChange,
  error,
  className,
  label = 'Type',
  types = [],
  loading = false,
  disabled = false,
}: PlaceTypeFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading || disabled}
      >
        <SelectTrigger className={cn(error && 'border-red-500')}>
          <SelectValue
            placeholder={
              loading
                ? 'Loading types...'
                : disabled
                  ? 'Select a subcategory first'
                  : 'Select a type'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {types.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex items-center gap-2">
                {type.icon && (
                  <IconRenderer icon={type.icon} className="w-4 h-4" />
                )}
                <span>{type.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
