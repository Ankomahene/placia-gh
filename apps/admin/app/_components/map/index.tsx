'use client';

import dynamic from 'next/dynamic';

export type { LatLon } from './location-picker';

/** The map library is large; it loads only on pages that show the picker. */
export const LocationPicker = dynamic(() => import('./location-picker'), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-surface-2" />,
});
