'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/safe-image';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  Navigation,
} from 'lucide-react';
import { PlaceResultsSummary } from '@/types/place';
import { useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getPlaceDetailsUrl } from '@/lib/utils/place-utils';

interface MapSidebarProps {
  places: PlaceResultsSummary[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceClick: (placeId: string) => void;
  onDirectionsRequest?: (placeId: string) => void;
  isLoading: boolean;
}

export function MapSidebar({
  places,
  isCollapsed,
  onToggleCollapse,
  hoveredPlaceId,
  selectedPlaceId,
  onPlaceHover,
  onPlaceClick,
  onDirectionsRequest,
  isLoading,
}: MapSidebarProps) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to scroll a card into view
  const scrollCardIntoView = useCallback(
    (placeId: string) => {
      const cardElement = cardRefs.current[placeId];
      if (!cardElement || isCollapsed || !scrollAreaRef.current) return;

      // Find the scroll viewport
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );

      if (scrollContainer) {
        // Check if card is already visible
        const containerRect = scrollContainer.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();

        // Calculate if card is fully visible within the container
        const isVisible =
          cardRect.top >= containerRect.top &&
          cardRect.bottom <= containerRect.bottom;

        // Only scroll if card is not fully visible
        if (!isVisible) {
          cardElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      }
    },
    [isCollapsed]
  );

  // Scroll card into view when hovered place changes
  useEffect(() => {
    if (hoveredPlaceId && !isCollapsed) {
      // Add a small delay to ensure the card is rendered
      const timeoutId = setTimeout(() => {
        scrollCardIntoView(hoveredPlaceId);
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [hoveredPlaceId, isCollapsed, scrollCardIntoView]);

  // Convert places to map markers with stable data
  const mapMarkers = places.map((place) => {
    // Generate stable data based on place ID
    const seed = place.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const isOpen = seed % 3 !== 0; // ~67% open rate
    const distance = ((seed % 47) / 10 + 0.2).toFixed(1); // 0.2-4.9 km range

    return {
      id: place.id,
      isOpen,
      distance: `${distance} km`,
    };
  });

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
                <h3 className="font-semibold text-md">
                  Showing {places.length} results
                </h3>
                <p className="text-xs text-muted-foreground">
                  Hover over map pins to highlight cards
                </p>
              </div>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="h-[calc(100vh-200px)]" ref={scrollAreaRef}>
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
                    const mapMarker = mapMarkers.find((m) => m.id === place.id);
                    const placeDetailsUrl = getPlaceDetailsUrl(place);

                    return (
                      <motion.div
                        key={place.id}
                        ref={(el) => {
                          cardRefs.current[place.id] = el;
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className={`
                            border rounded-lg overflow-hidden transition-all duration-200 cursor-pointer
                            ${
                              hoveredPlaceId === place.id ||
                              selectedPlaceId === place.id
                                ? 'border-primary shadow-md'
                                : 'border-border hover:border-primary/50'
                            }
                          `}
                        onMouseEnter={() => onPlaceHover(place.id)}
                        onMouseLeave={() => onPlaceHover(null)}
                        onClick={() => onPlaceClick(place.id)}
                      >
                        <div className="flex">
                          {/* Place Image */}
                          <div className="w-24 h-24 relative flex-shrink-0 bg-muted">
                            {place.main_image ? (
                              <SafeImage
                                src={place.main_image}
                                alt={place.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="w-8 h-8 text-primary/40"
                                >
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                  <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Place Info */}
                          <div className="p-3 flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-sm line-clamp-1">
                                    {place.name}
                                  </h3>
                                  {place.source === 'google' ||
                                  place.source === 'google_places' ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-1 py-0"
                                    >
                                      G
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-50 text-green-700 border-green-200 px-1 py-0"
                                    >
                                      P
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="ml-2 flex items-center gap-1">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    mapMarker?.isOpen
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                  }`}
                                />
                                <span
                                  className={`text-xs font-medium ${
                                    mapMarker?.isOpen
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {mapMarker?.isOpen ? 'Open' : 'Closed'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {place.location.name}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              {place.rate_average && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  <span className="text-xs font-medium">
                                    {place.rate_average}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ({place.rate_count || 0})
                                  </span>
                                </div>
                              )}

                              <div className="text-xs text-muted-foreground font-medium">
                                {mapMarker?.distance}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              <Link
                                href={placeDetailsUrl}
                                className="text-xs cursor-pointer text-primary hover:underline flex-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View details
                              </Link>

                              {onDirectionsRequest && (
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDirectionsRequest(place.id);
                                  }}
                                >
                                  <Navigation className="w-2 h-2" />
                                  Directions
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
