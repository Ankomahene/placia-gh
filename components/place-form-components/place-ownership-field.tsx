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

interface Ownership {
  id: string;
  type: string;
  icon?: string;
  description?: string;
}

interface PlaceOwnershipFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  ownerships?: Ownership[];
  loading?: boolean;
}

export function PlaceOwnershipField({
  value = '',
  onChange,
  error,
  className,
  label = 'Ownership',
  ownerships = [],
  loading = false,
}: PlaceOwnershipFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className={cn(error && 'border-red-500')}>
          <SelectValue
            placeholder={
              loading ? 'Loading ownership types...' : 'Select ownership type'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {ownerships.map((ownership) => (
            <SelectItem key={ownership.id} value={ownership.id}>
              <div className="flex items-center gap-2">
                {ownership.icon && (
                  <IconRenderer icon={ownership.icon} className="w-4 h-4" />
                )}
                <span>{ownership.type}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
