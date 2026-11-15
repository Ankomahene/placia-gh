'use client';

import { Expand } from 'lucide-react';
import { useState } from 'react';
import { PlaceMap } from './index';
import { StaticMap } from './static-map';
import type { MapDot } from './types';

/**
 * A place's surroundings: tile images first (no script cost on a cheap phone), the interactive
 * map only when the user asks for it.
 */
export function MiniMap({
  id,
  name,
  lat,
  lon,
  dots,
}: {
  id: string;
  name: string;
  lat: number;
  lon: number;
  dots: MapDot[];
}) {
  const [live, setLive] = useState(false);
  if (live) {
    return (
      <PlaceMap
        points={[{ id, name, lat, lon }]}
        dots={dots}
        focus={{ lat, lon, zoom: 15 }}
        className="size-full"
      />
    );
  }
  return (
    <div className="relative size-full">
      <StaticMap lat={lat} lon={lon} dots={dots} className="size-full" />
      <button
        type="button"
        onClick={() => setLive(true)}
        aria-label="Open map"
        className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-surface/90 shadow-card backdrop-blur-md hover:bg-surface"
      >
        <Expand className="size-[18px]" />
      </button>
    </div>
  );
}
