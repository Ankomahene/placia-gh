'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExternalLink, Globe } from 'lucide-react';

interface PlaceWebsiteFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function PlaceWebsiteField({
  value = '',
  onChange,
  error,
  className,
  label = 'Website',
  placeholder = 'https://example.com',
}: PlaceWebsiteFieldProps) {
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const formatUrl = (url: string) => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const handleBlur = () => {
    if (value && !isValidUrl(value)) {
      const formatted = formatUrl(value);
      if (isValidUrl(formatted)) {
        onChange(formatted);
      }
    }
  };

  const openWebsite = () => {
    if (value && isValidUrl(value)) {
      window.open(value, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="place-website" className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="place-website"
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              'pl-10',
              error && 'border-red-500',
              value && !isValidUrl(value) && 'border-amber-500'
            )}
          />
        </div>

        {value && isValidUrl(value) && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={openWebsite}
            className="shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>

      {value && !isValidUrl(value) && (
        <p className="text-sm text-amber-600">
          URL format appears invalid. It will be auto-formatted when you finish
          editing.
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {value && isValidUrl(value) && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Valid website URL
        </p>
      )}
    </div>
  );
}
