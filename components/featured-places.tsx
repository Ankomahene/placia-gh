'use client';

import { useRef } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PlaceCard from './place-card';
import { PlaceCardShimmer } from '@/components/ui/shimmer';
import { useFeaturedPlaces } from '@/hooks/use-featured-places';
import { useLocation } from '@/hooks/use-location';
import { calculateDistance } from '@/lib/utils';
import { PlaceResultsSummary, Place } from '@/types/place';

export default function FeaturedPlaces() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { data: places, isLoading, error } = useFeaturedPlaces();
  const { latitude, longitude } = useLocation();

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

  // Show error state
  if (error) {
    return (
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Featured Places</h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load featured places. Please try again later.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  // Show loading state with shimmers
  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Featured Places</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled
              className="rounded-full h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Scroll left</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled
              className="rounded-full h-8 w-8"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">Scroll right</span>
            </Button>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
          {Array.from({ length: 4 }).map((_, index) => (
            <PlaceCardShimmer key={index} />
          ))}
        </div>
      </section>
    );
  }

  // Show empty state
  if (!places || places.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Featured Places</h2>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>No featured places available at the moment.</p>
        </div>
      </section>
    );
  }

  // Show places
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Featured Places</h2>
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
        {places.map((place: Place) => {
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

          // Transform Place to PlaceResultsSummary
          const placeData: PlaceResultsSummary & {
            distance?: number;
            source?: 'platform' | 'google';
          } = {
            id: place.id,
            name: place.name,
            slug: place.slug,
            tagline: place.tagline,
            description: place.description,
            main_image: place.main_image,
            gallery: place.gallery,
            location: place.location,
            country: { id: place.country_id, name: '' },
            region: { id: place.region_id, name: '' },
            city: { id: place.city_id, name: '' },
            category: { id: place.category_id, name: '', slug: '' },
            subcategory: { id: place.subcategory_id, name: '', slug: '' },
            rate_average: place.rating?.rate,
            rate_count: place.rating?.count,
            features: place.features,
            services: place.services,
            tags: place.tags,
            accessibility: place.accessibility,
            ...(distanceInKm && { distance: distanceInKm }),
            source: 'platform',
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
