'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { recentlyViewedPlaces } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function RecentlyViewedPlaces() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 320; // Approximate card width + gap

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Recently Viewed Places</h3>
          <p className="text-sm text-muted-foreground">
            Places you&apos;ve viewed recently
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="rounded-full h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Scroll left</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="rounded-full h-8 w-8"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Scroll right</span>
          </Button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {recentlyViewedPlaces.map((place) => (
          <div key={place.id} className="min-w-[300px] max-w-[300px]">
            <div className="relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="aspect-[4/3] relative">
                <Image
                  src={place.image}
                  alt={place.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 right-3">
                  <div
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      place.isOpen
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}
                  >
                    {place.isOpen ? 'Open' : 'Closed'}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-lg mb-1">{place.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {place.address}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{place.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      • {place.category}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {place.distance}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
