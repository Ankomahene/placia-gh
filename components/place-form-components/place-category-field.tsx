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

interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface PlaceCategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  categories?: Category[];
  loading?: boolean;
}

export function PlaceCategoryField({
  value,
  onChange,
  error,
  className,
  label = 'Category',
  categories = [],
  loading = false,
}: PlaceCategoryFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-red-500 ml-1">*</span>
      </Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className={cn(error && 'border-red-500')}>
          <SelectValue
            placeholder={
              loading ? 'Loading categories...' : 'Select a category'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                {category.icon && (
                  <IconRenderer icon={category.icon} className="w-4 h-4" />
                )}
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
