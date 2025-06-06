'use client';

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRegions, useRegionById } from '@/hooks/use-countries-regions';
import { Badge } from '../ui/badge';

interface PlaceRegionFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  countryId: string;
  defaultRegionId?: string;
  matchedRegion?: { id?: string; name?: string };
  onMatchedRegionSelect?: (regionId: string) => void;
}

export function PlaceRegionField({
  value,
  onChange,
  error,
  className,
  label = 'Region/State',
  countryId,
  defaultRegionId,
  matchedRegion,
  onMatchedRegionSelect,
}: PlaceRegionFieldProps) {
  const {
    data: regions,
    isLoading,
    error: regionsError,
  } = useRegions(countryId);
  const { data: selectedRegion } = useRegionById(value);
  const isDisabled = !countryId || isLoading;

  // Set default value if provided and no current value
  useEffect(() => {
    if (defaultRegionId && !value && regions && regions.length > 0) {
      const defaultRegion = regions.find((r) => r.id === defaultRegionId);
      if (defaultRegion) {
        onChange(defaultRegionId);
      }
    }
  }, [defaultRegionId, value, regions, onChange]);

  // Clear value when country changes
  useEffect(() => {
    if (value && regions && !regions.find((r) => r.id === value)) {
      onChange('');
    }
  }, [regions, value, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-red-500 ml-1">*</span>
      </Label>
      <Select value={value} onValueChange={onChange} disabled={isDisabled}>
        <SelectTrigger className={cn(error && 'border-red-500', 'w-full')}>
          <SelectValue>
            {isLoading
              ? 'Loading regions...'
              : !countryId
                ? 'Select a country first'
                : selectedRegion
                  ? selectedRegion.name
                  : 'Select a region/state'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {regions?.map((region) => (
            <SelectItem key={region.id} value={region.id}>
              {region.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {regionsError && (
        <p className="text-sm text-red-500">Failed to load regions</p>
      )}

      {matchedRegion?.id && (!value || value !== matchedRegion.id) && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Suggested region based on selected location:{' '}
          </p>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
            title="Select this region"
            onClick={() => {
              if (matchedRegion.id) {
                onChange(matchedRegion.id);
              }
            }}
          >
            {matchedRegion.name}
          </Badge>
        </div>
      )}
    </div>
  );
}
