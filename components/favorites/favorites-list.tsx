'use client';

import PlaceCard from '@/components/place-card';
import { mockPlaces, Place } from '@/lib/mock-data';

export function FavoritesList() {
  return (
    <div className="space-y-4">
      {mockPlaces.map((place: Place) => (
        <PlaceCard key={place.id} place={place} className="w-full" />
      ))}
    </div>
  );
}
