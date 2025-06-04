'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { MapPin, Loader2 } from 'lucide-react';
import { Place } from '@/types/place';
import { PlaceCard } from '../cards/place-card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

interface MapViewProps {
  places: Place[];
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
  isLoading: boolean;
}

// Mock map component for demo (since we don't have real map setup)
function MockMap({
  places,
  hoveredPlaceId,
  selectedPlaceId,
  onPlaceHover,
  onPlaceSelect,
  onMapPinHover,
}: {
  places: Place[];
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
  onMapPinHover: (placeId: string | null) => void;
}) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 opacity-20">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Mock Map Markers */}
      <div className="absolute inset-0 p-8">
        {places.map((place, index) => {
          const x = 15 + (index % 5) * 18;
          const y = 20 + Math.floor(index / 5) * 25;
          const isHovered = hoveredPlaceId === place.id;
          const isSelected = selectedPlaceId === place.id;

          return (
            <motion.div
              key={place.id}
              className="absolute cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: isHovered || isSelected ? 1.2 : 1,
              }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onMouseEnter={() => {
                onPlaceHover(place.id);
                onMapPinHover(place.id);
              }}
              onMouseLeave={() => {
                onPlaceHover(null);
                onMapPinHover(null);
              }}
              onClick={() => onPlaceSelect(place.id)}
            >
              <div
                className={`
                relative w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-200
                ${
                  isSelected
                    ? 'bg-primary ring-4 ring-primary/30'
                    : isHovered
                      ? 'bg-primary/80 ring-2 ring-primary/50'
                      : 'bg-primary/70'
                }
              `}
              >
                <MapPin className="h-4 w-4" />
              </div>

              {/* Popup on hover */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-background border border-border rounded-lg shadow-lg p-3 min-w-48 z-10"
                >
                  <div className="text-sm font-medium mb-1">{place.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {place.location.name}
                  </div>
                  {place.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-xs">
                        {place.rating.rate} ({place.rating.count})
                      </span>
                    </div>
                  )}
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3">
        <div className="text-xs font-medium mb-2">Ghana Map View</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span>{places.length} places found</span>
        </div>
      </div>
    </div>
  );
}

export function MapView({
  places,
  hoveredPlaceId,
  selectedPlaceId,
  onPlaceHover,
  onPlaceSelect,
  isLoading,
}: MapViewProps) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to scroll a card into view
  const scrollCardIntoView = (placeId: string) => {
    const cardElement = cardRefs.current[placeId];
    if (cardElement && scrollAreaRef.current) {
      // Find the scroll container within ScrollArea
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();

        // Calculate if card is out of view
        const cardTop =
          cardRect.top - containerRect.top + scrollContainer.scrollTop;
        const cardBottom = cardTop + cardRect.height;
        const viewportTop = scrollContainer.scrollTop;
        const viewportBottom = viewportTop + containerRect.height;

        // Only scroll if card is not fully visible
        if (cardTop < viewportTop || cardBottom > viewportBottom) {
          // Calculate scroll position to center the card in view
          const targetScrollTop =
            cardTop - containerRect.height / 2 + cardRect.height / 2;

          scrollContainer.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth',
          });
        }
      }
    }
  };

  // Handle map pin hover with auto-scroll
  const handleMapPinHover = (placeId: string | null) => {
    if (placeId) {
      scrollCardIntoView(placeId);
    }
  };

  // Handle regular card hover
  const handleCardHover = (placeId: string | null) => {
    onPlaceHover(placeId);
  };

  if (places.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No places to show on map
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Map */}
      <div className="flex-1 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <MockMap
            places={places}
            hoveredPlaceId={hoveredPlaceId}
            selectedPlaceId={selectedPlaceId}
            onPlaceHover={onPlaceHover}
            onPlaceSelect={onPlaceSelect}
            onMapPinHover={handleMapPinHover}
          />
        </motion.div>
      </div>

      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="w-96 border-l border-border bg-background/50 backdrop-blur-sm flex flex-col"
      >
        {/* Sidebar Header - Fixed */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-lg">Places ({places.length})</h3>
          <p className="text-sm text-muted-foreground">
            Hover over map pins to highlight cards
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 space-y-3">
              {isLoading && places.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading places...</span>
                  </div>
                </div>
              ) : (
                places.map((place, index) => (
                  <motion.div
                    key={place.id}
                    ref={(el) => {
                      cardRefs.current[place.id] = el;
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <PlaceCard
                      place={place}
                      isHovered={hoveredPlaceId === place.id}
                      isSelected={selectedPlaceId === place.id}
                      onHover={handleCardHover}
                      onSelect={onPlaceSelect}
                      variant="compact"
                    />
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.div>
    </div>
  );
}
