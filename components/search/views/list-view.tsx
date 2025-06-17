'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { PlaceResultsSummary } from '@/types/place';
import { SearchResultCard } from '../cards/search-result-card';
import { Button } from '@/components/ui/button';

interface ListViewProps {
  places: PlaceResultsSummary[];
  hoveredPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 20;

export function ListView({
  places,
  hoveredPlaceId,
  onPlaceHover,
  onPlaceSelect,
  onLoadMore,
  hasMore,
  isLoading,
}: ListViewProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);

  // Deduplicate places using Map for O(n) performance
  const deduplicatedPlaces = useMemo(() => {
    const placeMap = new Map<string, PlaceResultsSummary>();
    places.forEach((place) => {
      if (!placeMap.has(place.id)) {
        placeMap.set(place.id, place);
      }
    });
    return Array.from(placeMap.values());
  }, [places]);

  // Get currently displayed places
  const displayedPlaces = useMemo(() => {
    return deduplicatedPlaces.slice(0, displayedCount);
  }, [deduplicatedPlaces, displayedCount]);

  const hasMoreLocal = displayedCount < deduplicatedPlaces.length;
  const hasMoreServer = hasMore && displayedCount >= deduplicatedPlaces.length;

  // Reset displayed count when search changes
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [deduplicatedPlaces.length === 0]);

  // Load more from local data
  const loadMoreLocal = () => {
    setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
  };

  // Intersection Observer for infinite scroll (local data only)
  useEffect(() => {
    if (!hasMoreLocal || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreLocal();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreLocal, isLoading]);

  if (deduplicatedPlaces.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No places found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-6">
        {/* List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {displayedPlaces.map((place) => (
            <SearchResultCard
              key={place.id}
              place={place}
              onHover={onPlaceHover}
              isSelected={hoveredPlaceId === place.id}
              variant="list"
              onClick={() => onPlaceSelect(place.id)}
            />
          ))}
        </div>

        {/* Load More Section */}
        {(hasMoreLocal || hasMoreServer || isLoading) && (
          <div className="flex items-center justify-center py-8">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more places...</span>
              </div>
            ) : hasMoreLocal ? (
              <div
                ref={loadMoreRef}
                className="flex flex-col items-center gap-3"
              >
                <Button
                  onClick={loadMoreLocal}
                  variant="outline"
                  className="px-8"
                >
                  Show More Places ({deduplicatedPlaces.length - displayedCount}{' '}
                  remaining)
                </Button>
                <p className="text-xs text-muted-foreground">
                  Showing {displayedCount} of {deduplicatedPlaces.length} places
                </p>
              </div>
            ) : hasMoreServer ? (
              <Button onClick={onLoadMore} variant="outline" className="px-8">
                Load More places
              </Button>
            ) : null}
          </div>
        )}

        {/* No more results message */}
        {!hasMoreLocal &&
          !hasMoreServer &&
          deduplicatedPlaces.length > 0 &&
          !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                You&apos;ve seen all {deduplicatedPlaces.length} places
              </p>
              {deduplicatedPlaces.length !== places.length && (
                <p className="text-xs text-muted-foreground mt-1">
                  ({places.length - deduplicatedPlaces.length} duplicates
                  removed)
                </p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
