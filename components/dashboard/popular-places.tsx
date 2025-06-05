'use client';

import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Star } from 'lucide-react';

const places = [
  {
    id: '1',
    name: 'Buka Restaurant',
    image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
    rating: 4.7,
    reviews: 128,
    category: 'Restaurant',
    distance: '1.2 km',
  },
  {
    id: '2',
    name: 'Labadi Beach Hotel',
    image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
    rating: 4.9,
    reviews: 256,
    category: 'Hotel',
    distance: '3.8 km',
  },
  {
    id: '3',
    name: 'Accra Mall',
    image: 'https://images.pexels.com/photos/1050244/pexels-photo-1050244.jpeg',
    rating: 4.5,
    reviews: 512,
    category: 'Shopping',
    distance: '5.1 km',
  },
  {
    id: '4',
    name: 'Kwame Nkrumah Memorial Park',
    image: 'https://images.pexels.com/photos/4350631/pexels-photo-4350631.jpeg',
    rating: 4.8,
    reviews: 384,
    category: 'Attraction',
    distance: '2.8 km',
  },
];

export function PopularPlaces() {
  return (
    <ScrollArea>
      <div className="flex space-x-4 pb-4">
        {places.map((place) => (
          <div
            key={place.id}
            className="relative w-[300px] shrink-0 overflow-hidden rounded-xl border"
          >
            <div className="aspect-[4/3] relative">
              <Image
                src={place.image}
                alt={place.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{place.name}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-medium">{place.rating}</span>
                </div>
                <span className="text-muted-foreground">
                  ({place.reviews} reviews)
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{place.category}</span>
                <span>{place.distance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}