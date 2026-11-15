'use client';

import { Button } from '@placia/ui/button';
import { LocateFixed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUserLocation } from '../_lib/location';
import { PlaceMap } from './map';

/**
 * Phones get a drawing until the user shares where they are, so a first visit on mobile data
 * never downloads the map library. Wide screens load the real map straight away.
 */
export function NearYou() {
  const { location, status, ask } = useUserLocation();
  const [desktop, setDesktop] = useState(false);
  useEffect(() => setDesktop(window.matchMedia('(min-width: 768px)').matches), []);
  const live = desktop || location != null;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-surface shadow-card">
      <div className="h-44 md:h-[26rem]">
        {live ? (
          <PlaceMap
            points={[]}
            user={location}
            focus={location ? { lat: location.lat, lon: location.lon, zoom: 14 } : null}
            interactive={desktop}
            className="size-full"
          />
        ) : (
          <MapPreview />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t p-3 md:px-5 md:py-4">
        <span className="font-medium text-sm">
          {location ? 'Your location' : status === 'denied' ? 'Location blocked' : 'Ghana'}
        </span>
        {location ? (
          <a href="/search?q=near+me" className="font-medium text-primary text-sm hover:underline">
            What's near me
          </a>
        ) : (
          <Button variant="soft" size="sm" onClick={ask} disabled={status === 'asking'}>
            <LocateFixed />
            {status === 'asking' ? 'Locating…' : 'Use my location'}
          </Button>
        )}
      </div>
    </div>
  );
}

/** A drawing of a map: no network at all. */
function MapPreview() {
  return (
    <svg
      viewBox="0 0 400 180"
      className="block size-full"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Map preview"
    >
      <rect width="400" height="180" className="fill-surface-2" />
      <g className="stroke-border" strokeWidth="10" fill="none" strokeLinecap="round">
        <path d="M-10 120 C 80 100, 140 150, 230 110 S 360 60, 410 80" />
        <path d="M120 -10 C 130 60, 110 120, 150 190" />
        <path d="M280 -10 L 300 190" />
      </g>
      <g className="stroke-border" strokeWidth="3" fill="none">
        <path d="M-10 50 L 410 30" />
        <path d="M40 -10 L 70 190" />
        <path d="M200 -10 C 210 80, 190 120, 220 190" />
        <path d="M-10 160 L 410 150" />
      </g>
      {[
        [96, 92],
        [180, 64],
        [250, 124],
        [322, 80],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <circle r="13" className="fill-primary/15" />
          <circle r="6" className="fill-primary stroke-surface" strokeWidth="2.5" />
        </g>
      ))}
      <g transform="translate(200 98)">
        <circle r="20" className="fill-accent/25" />
        <circle r="8" className="fill-accent stroke-surface" strokeWidth="3" />
      </g>
    </svg>
  );
}
