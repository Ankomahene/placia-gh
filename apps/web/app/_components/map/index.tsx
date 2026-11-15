'use client';

import { cn } from '@placia/ui/cn';
import dynamic from 'next/dynamic';
import type { PlaceMapProps } from './types';

export type { MapDot, MapPoint, PlaceMapProps } from './types';

/**
 * The map library is large (~250 KB gzipped), so it loads only when a map is on screen and never
 * holds up the page: the list and search work before it arrives.
 */
export const PlaceMap = dynamic(() => import('./place-map'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export function MapSkeleton({ className }: { className?: string }) {
  return <div className={cn('size-full animate-pulse bg-surface-2', className)} />;
}

export function LazyMap(props: PlaceMapProps) {
  return <PlaceMap {...props} />;
}

export const LocationPicker = dynamic(() => import('./location-picker'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
