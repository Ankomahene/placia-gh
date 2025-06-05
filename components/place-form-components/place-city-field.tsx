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
import { useCities, useCityById } from '@/hooks/use-countries-regions';

interface PlaceCityFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  regionId: string;
  defaultCityId?: string;
}

export function PlaceCityField({
  value,
  onChange,
  error,
  className,
  label = 'City',
  regionId,
  defaultCityId,
}: PlaceCityFieldProps) {
  const {
    data: cities = [],
    isLoading,
    error: queryError,
  } = useCities(regionId);
  const { data: selectedCity } = useCityById(value);
  const isDisabled = !regionId || isLoading;

  // Set default value if provided and no current value
  useEffect(() => {
    if (defaultCityId && !value && cities.length > 0) {
      const defaultCity = cities.find((c) => c.id === defaultCityId);
      if (defaultCity) {
        onChange(defaultCityId);
      }
    }
  }, [defaultCityId, value, cities, onChange]);

  // Clear value when region changes
  useEffect(() => {
    if (value && !cities.find((c) => c.id === value)) {
      onChange('');
    }
  }, [cities, value, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-red-500 ml-1">*</span>
      </Label>
      <Select value={value} onValueChange={onChange} disabled={isDisabled}>
        <SelectTrigger className={cn(error && 'border-red-500')}>
          <SelectValue>
            {isLoading
              ? 'Loading cities...'
              : !regionId
                ? 'Select a region first'
                : selectedCity
                  ? selectedCity.name
                  : 'Select a city'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {queryError && (
        <p className="text-sm text-red-500">Failed to load cities</p>
      )}
    </div>
  );
}
