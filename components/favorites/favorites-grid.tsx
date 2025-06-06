'use client';

import { PlaceCard } from '@/components/search/cards/place-card';
import { mockPlaces } from '@/lib/mock-data';

export function FavoritesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockPlaces.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          onHover={() => {}}
          onSelect={() => {}}
        />
      ))}
    </div>
  );
}