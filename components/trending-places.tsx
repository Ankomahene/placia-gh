'use client';

import { useRef } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlaceCard from './place-card';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@/hooks/use-location';
import { calculateDistance } from '@/lib/utils';
import { PlaceResultsSummary } from '@/types/place';

async function fetchTrendingPlaces(): Promise<PlaceResultsSummary[]> {
  const response = await fetch('/api/places/trending');
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch trending places');
  }
  return data.data;
}

export default function TrendingPlaces() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { latitude, longitude } = useLocation();

  const {
    data: places,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['trending-places'],
    queryFn: fetchTrendingPlaces,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

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

  if (error) {
    return null; // Hide section on error
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Trending Places</h2>
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
        className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoading
          ? // Loading state with shimmer effect
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[280px] max-w-[280px] animate-pulse"
              >
                <div className="h-[200px] bg-muted rounded-lg mb-3" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))
          : places?.map((place) => {
              // Calculate distance if user location is available
              const distanceInKm =
                latitude && longitude && place.location
                  ? calculateDistance(
                      latitude,
                      longitude,
                      place.location.lat,
                      place.location.lng,
                      'km'
                    )
                  : undefined;

              // Prepare place data with source and distance
              const placeData: PlaceResultsSummary & {
                distance?: number;
                source?: 'platform' | 'google';
              } = {
                ...place,
                ...(distanceInKm && { distance: distanceInKm }),
                source: 'google',
              };

              return (
                <div key={place.id} className="min-w-[280px] max-w-[280px]">
                  <PlaceCard place={placeData} />
                </div>
              );
            })}
      </div>
    </section>
  );
}
