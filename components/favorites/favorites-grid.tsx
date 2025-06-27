'use client';

// import PlaceCard from '@/components/place-card';
// import { mockPlaces, Place } from '@/lib/mock-data';

export function FavoritesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* {mockPlaces.map((place: Place) => ( 
          <PlaceCard key={place.id} place={place} /> 
      ))} */}

      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">No favorites yet</div>
      </div>
    </div>
  );
}
