'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { CollapsibleSidebarProps } from './types';
import { PlaceCard } from './PlaceCard';

export function CollapsibleSidebar({
  places,
  isCollapsed,
  onToggleCollapse,
  hoveredPlaceId,
  selectedPlaceId,
  onPlaceHover,
  onPlaceClick,
  onDirectionsRequest,
  isLoading,
  cardRefs,
}: CollapsibleSidebarProps) {
  // Convert places to map markers with stable data
  const mapMarkers = places.map((place) => {
    const seed = place.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const isOpen = seed % 3 !== 0;
    const distance = ((seed % 47) / 10 + 0.2).toFixed(1);

    return {
      id: place.id,
      position: { lat: place.location.lat, lng: place.location.lng },
      name: place.name,
      isOpen,
      rating: place.rate_average,
      category: place.category?.name || 'Place',
      image: place.main_image,
      address: place.location.name || place.formatted_address || place.vicinity,
      distance: `${distance} km`,
    };
  });

  // Safe function to set card ref
  const setCardRef = (placeId: string, el: HTMLDivElement | null) => {
    try {
      if (cardRefs?.current && placeId) {
        cardRefs.current[placeId] = el;
      }
    } catch (error) {
      console.warn('Error setting card ref:', error);
    }
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleCollapse}
        className="absolute left-0 top-4 z-10 h-10 w-10 p-0 border-2 bg-background/95 backdrop-blur-sm shadow-lg"
        style={{ transform: 'translateX(-50%)' }}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Sidebar Content */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 384, opacity: 1 }} // w-96 = 384px
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-l border-border bg-background/50 backdrop-blur-sm flex flex-col overflow-hidden"
          >
            {/* Sidebar Header - Fixed */}
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="ml-6">
                {' '}
                {/* Offset for toggle button */}
                <h3 className="font-semibold text-lg">
                  Places ({places.length})
                </h3>
                <p className="text-sm text-muted-foreground">
                  Hover over map pins to highlight cards
                </p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {isLoading && places.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading places...</span>
                      </div>
                    </div>
                  ) : (
                    places.map((place, index) => {
                      const mapMarker = mapMarkers.find(
                        (m) => m.id === place.id
                      );
                      return (
                        <motion.div
                          key={place.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                          <PlaceCard
                            place={place}
                            isHovered={hoveredPlaceId === place.id}
                            isSelected={selectedPlaceId === place.id}
                            onHover={onPlaceHover}
                            onClick={onPlaceClick}
                            onDirectionsRequest={onDirectionsRequest}
                            mapMarker={mapMarker}
                            cardRef={null}
                          />
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
