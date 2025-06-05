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

interface Subcategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface PlaceSubcategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  subcategories?: Subcategory[];
  loading?: boolean;
  disabled?: boolean;
}

export function PlaceSubcategoryField({
  value,
  onChange,
  error,
  className,
  label = 'Subcategory',
  subcategories = [],
  loading = false,
  disabled = false,
}: PlaceSubcategoryFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-red-500 ml-1">*</span>
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
                ? 'Loading subcategories...'
                : disabled
                  ? 'Select a category first'
                  : 'Select a subcategory'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {subcategories.map((subcategory) => (
            <SelectItem key={subcategory.id} value={subcategory.id}>
              <div className="flex items-center gap-2">
                {subcategory.icon && (
                  <IconRenderer icon={subcategory.icon} className="w-4 h-4" />
                )}
                <span>{subcategory.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
