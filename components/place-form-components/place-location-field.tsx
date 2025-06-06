'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import type { MatchedLocation } from '@/lib/services/location-matching';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
  () =>
    import('@/components/location-picker').then((mod) => ({
      default: mod.LocationPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted rounded-md flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading location picker...</div>
      </div>
    ),
  }
);

interface PlaceLocationFieldProps {
  value?: {
    lng: number;
    lat: number;
    name: string;
    street_address: string;
  };
  onChange: (location: {
    lng: number;
    lat: number;
    name: string;
    street_address: string;
  }) => void;
  onLocationMatch?: (matched: MatchedLocation) => void;
  error?: string;
  className?: string;
  label?: string;
  required?: boolean;
  showMap?: boolean;
  mapHeight?: string;
}

export function PlaceLocationField({
  value,
  onChange,
  onLocationMatch,
  error,
  className,
  label = 'Location',
  required = false,
  showMap = true,
  mapHeight = '300px',
}: PlaceLocationFieldProps) {
  const handleLocationChange = (matched: MatchedLocation) => {
    // Update the location coordinates and address
    onChange(matched.location);

    // Provide the full matched data to parent for form updates
    onLocationMatch?.(matched);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <LocationPicker
        value={{ location: value }}
        onChange={handleLocationChange}
        showMap={showMap}
        mapHeight={mapHeight}
        required={required}
        error={error}
      />
    </div>
  );
}
