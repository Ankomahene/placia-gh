'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Place } from '@/types/place';
import { PlaceCard } from '../cards/place-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

// Dynamically import map components to avoid SSR issues
const DynamicSearchMap = dynamic(
  () => import('./search-map-client').then((mod) => mod.SearchMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface MapViewProps {
  places: Place[];
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
  isLoading: boolean;
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

  // Convert places to map markers
  const mapMarkers = places.map(place => ({
    id: place.id,
    position: [place.location.lat, place.location.lng] as [number, number],
    name: place.name,
    isOpen: true, // You can add this property to your Place type if needed
    rating: place.rating?.rate,
    category: place.category_id,
    image: place.main_image,
    address: place.location.name || place.location.street_address
  }));

  if (places.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-16 w-16 text-muted-foreground mx-auto mb-4">
            <svg viewBox="0 0 24 24\" fill="none\" stroke="currentColor\" strokeWidth="2\" className="w-full h-full">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
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
          className="w-full h-full rounded-xl overflow-hidden border border-border"
        >
          <DynamicSearchMap
            markers={mapMarkers}
            hoveredMarkerId={hoveredPlaceId}
            selectedMarkerId={selectedPlaceId}
            onMarkerHover={onPlaceHover}
            onMarkerClick={onPlaceSelect}
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
                    className={`
                      border rounded-lg overflow-hidden transition-all duration-200
                      ${hoveredPlaceId === place.id || selectedPlaceId === place.id 
                        ? 'border-primary shadow-md' 
                        : 'border-border hover:border-primary/50'}
                    `}
                  >
                    <div className="flex">
                      {/* Place Image */}
                      <div className="w-24 h-24 relative flex-shrink-0 bg-muted">
                        {place.main_image ? (
                          <Image
                            src={place.main_image}
                            alt={place.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-primary/40">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Place Info */}
                      <div className="p-3 flex-1">
                        <h3 className="font-medium text-sm line-clamp-1">{place.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {place.location.name || place.location.street_address}
                        </p>
                        
                        {place.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="text-yellow-500">★</div>
                            <span className="text-xs font-medium">{place.rating.rate}</span>
                            <span className="text-xs text-muted-foreground">
                              ({place.rating.count})
                            </span>
                          </div>
                        )}
                        
                        <div 
                          className="mt-2 text-xs cursor-pointer text-primary hover:underline"
                          onClick={() => onPlaceSelect(place.id)}
                        >
                          View details
                        </div>
                      </div>
                    </div>
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