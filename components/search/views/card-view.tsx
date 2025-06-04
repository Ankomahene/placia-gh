'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Place } from '@/types/place';
import { PlaceCard } from '../cards/place-card';
import { Button } from '@/components/ui/button';

interface CardViewProps {
  places: Place[];
  hoveredPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function CardView({
  places,
  hoveredPlaceId,
  onPlaceHover,
  onPlaceSelect,
  onLoadMore,
  hasMore,
  isLoading,
}: CardViewProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (places.length === 0 && !isLoading) {
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
        {/* Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {places.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <PlaceCard
                place={place}
                isHovered={hoveredPlaceId === place.id}
                onHover={onPlaceHover}
                onSelect={onPlaceSelect}
                variant="default"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Load More Section */}
        {(hasMore || isLoading) && (
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center py-8"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more places...</span>
              </div>
            ) : hasMore ? (
              <Button onClick={onLoadMore} variant="outline" className="px-8">
                Load More Places
              </Button>
            ) : null}
          </div>
        )}

        {/* No more results message */}
        {!hasMore && places.length > 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              You&apos;ve seen all {places.length} places
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
