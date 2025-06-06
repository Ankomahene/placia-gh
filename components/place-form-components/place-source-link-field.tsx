'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExternalLink, Link } from 'lucide-react';

interface PlaceSourceLinkFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function PlaceSourceLinkField({
  value = '',
  onChange,
  error,
  className,
  label = 'Source Link',
  placeholder = 'https://source-website.com/place-details',
}: PlaceSourceLinkFieldProps) {
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const openLink = () => {
    if (value && isValidUrl(value) && typeof window !== 'undefined') {
      window.open(value, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="place-source-link" className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="place-source-link"
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn('pl-10', error && 'border-red-500')}
          />
        </div>

        {value && isValidUrl(value) && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={openLink}
            className="shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {value && isValidUrl(value) && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Valid source link
        </p>
      )}
    </div>
  );
}
