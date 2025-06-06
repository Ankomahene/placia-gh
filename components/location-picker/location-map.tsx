'use client';

import dynamic from 'next/dynamic';

// Dynamic import of the actual map component to avoid SSR issues
const SimpleLocationMap = dynamic(
  () =>
    import('./location-map-client').then((mod) => ({
      default: mod.SimpleLocationMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="bg-muted rounded-md flex items-center justify-center"
        style={{ height: '400px' }}
      >
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    ),
  }
);

interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  zoom?: number;
  height?: string;
  className?: string;
  draggable?: boolean;
  showControls?: boolean;
}

export function LocationMap(props: LocationMapProps) {
  return <SimpleLocationMap {...props} />;
}
