'use client';

import { PlaceCard } from '@/components/search/cards/place-card';
import { mockPlaces } from '@/lib/mock-data';

export function FavoritesList() {
  return (
    <div className="space-y-4">
      {mockPlaces.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          variant="list"
          onHover={() => {}}
          onSelect={() => {}}
        />
      ))}
    </div>
  );
}