'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  MapPin,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useLocation } from '@/hooks/use-location';
import { useQuery } from '@tanstack/react-query';
import { PlaceResultsSummary } from '@/types/place';
import { MapView } from '@/components/search/views/map-view';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/safe-image';
import { cn } from '@/lib/utils';
import { getPlaceDetailsUrl } from '@/lib/utils/place-utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Function to fetch nearby places
async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  address: string | undefined
): Promise<PlaceResultsSummary[]> {
  const response = await fetch(
    `/api/places/nearby?lat=${lat}&lng=${lng}&radius=5000&address=${address || ''}`
  );
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch nearby places');
  }
  return data.data;
}

// Function to get random position for floating cards (with better spacing)
function getRandomPosition(index: number) {
  const positions = [
    { x: 20, y: 20 }, // Top left area
    { x: -15, y: 40 }, // Bottom left area
    { x: 25, y: 60 }, // Bottom center area
    { x: -10, y: 15 }, // Top center area
  ];

  // Use predefined positions to prevent overlap
  const basePosition = positions[index % positions.length];

  // Add some randomness within a smaller range
  return {
    x: basePosition.x + (Math.random() * 10 - 5),
    y: basePosition.y + (Math.random() * 8 - 4),
  };
}

export function MapPreview() {
  const {
    latitude,
    longitude,
    address,
    loading: locationLoading,
  } = useLocation();
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] =
    useState<PlaceResultsSummary | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Collapsed by default for mobile
  const [floatingCards, setFloatingCards] = useState<
    Array<PlaceResultsSummary & { position: { x: number; y: number } }>
  >([]);
  const [closedCardIds, setClosedCardIds] = useState<Set<string>>(new Set());

  // Function to close a floating card
  const closeFloatingCard = (placeId: string) => {
    setClosedCardIds((prev) => new Set(prev).add(placeId));
  };

  // Filter out closed cards for display
  const visibleFloatingCards = floatingCards.filter(
    (card) => !closedCardIds.has(card.id)
  );

  // Fetch nearby places when location changes
  const {
    data: places = [],
    isLoading: placesLoading,
    error,
  } = useQuery({
    queryKey: ['nearby-places', latitude, longitude],
    queryFn: () => fetchNearbyPlaces(latitude!, longitude!, address || ''),
    enabled: !!latitude && !!longitude,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const isLoading = locationLoading || placesLoading;

  // Update floating cards when places change
  useEffect(() => {
    if (places && places.length > 0) {
      // Reset closed cards when places change
      setClosedCardIds(new Set());

      // Take up to 3 places for floating cards to prevent overcrowding
      const shuffled = [...places].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3).map((place, index) => ({
        ...place,
        position: getRandomPosition(index),
      }));
      setFloatingCards(selected);

      // Update positions every 20 seconds
      const interval = setInterval(() => {
        setFloatingCards((current) =>
          current.map((card, index) => ({
            ...card,
            position: getRandomPosition(index),
          }))
        );
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [places]);

  // Handle responsive sidebar state
  useEffect(() => {
    const handleResize = () => {
      // Auto-expand sidebar on desktop, collapse on mobile
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setIsSidebarCollapsed(false);
      } else {
        setIsSidebarCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate stable data for places
  const placesWithMetadata = useMemo(() => {
    return places.map((place) => {
      const seed = place.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const isOpen = seed % 3 !== 0;
      const distance = ((seed % 47) / 10 + 0.2).toFixed(1);

      return {
        ...place,
        isOpen,
        distance: `${distance} km`,
      };
    });
  }, [places]);

  // Show loading state or error state before rendering map
  if (isLoading || !latitude || !longitude) {
    return (
      <Card className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30">
        {/* Base map-like background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-green-100/10 dark:from-slate-800/30 dark:via-transparent dark:to-slate-700/20" />

        {/* Grid pattern to simulate map tiles */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative aspect-[16/9] md:aspect-[2/1] lg:aspect-[2.5/1] xl:aspect-[3/1] overflow-hidden rounded-lg">
          {/* Animated gradient lines */}
          <div className="absolute inset-0">
            {/* Horizontal scanning lines */}
            <div
              className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-pulse"
              style={{ animation: 'scan-horizontal 3s ease-in-out infinite' }}
            />
            <div
              className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent animate-pulse"
              style={{
                animation: 'scan-horizontal 3s ease-in-out infinite 1s',
              }}
            />
            <div
              className="absolute top-3/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse"
              style={{
                animation: 'scan-horizontal 3s ease-in-out infinite 2s',
              }}
            />

            {/* Vertical scanning lines */}
            <div
              className="absolute top-0 left-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-pulse"
              style={{ animation: 'scan-vertical 4s ease-in-out infinite' }}
            />
            <div
              className="absolute top-0 left-3/4 w-0.5 h-full bg-gradient-to-b from-transparent via-teal-400/30 to-transparent animate-pulse"
              style={{
                animation: 'scan-vertical 4s ease-in-out infinite 1.5s',
              }}
            />

            {/* Animated map tile placeholders */}
            <div className="absolute top-6 left-6 w-16 h-12 bg-gradient-to-r from-slate-200/60 via-slate-300/40 to-slate-200/60 dark:from-slate-700/60 dark:via-slate-600/40 dark:to-slate-700/60 rounded animate-pulse" />
            <div
              className="absolute top-6 right-6 w-20 h-14 bg-gradient-to-r from-slate-200/60 via-slate-300/40 to-slate-200/60 dark:from-slate-700/60 dark:via-slate-600/40 dark:to-slate-700/60 rounded animate-pulse"
              style={{ animationDelay: '0.5s' }}
            />
            <div
              className="absolute bottom-6 left-1/3 w-24 h-10 bg-gradient-to-r from-slate-200/60 via-slate-300/40 to-slate-200/60 dark:from-slate-700/60 dark:via-slate-600/40 dark:to-slate-700/60 rounded animate-pulse"
              style={{ animationDelay: '1s' }}
            />

            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5 transform -skew-x-12 animate-shimmer" />
          </div>

          {/* Loading content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground bg-background/80 dark:bg-background/70 backdrop-blur-sm px-6 py-4 rounded-lg border border-border/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="absolute inset-0 animate-ping">
                    <div className="h-5 w-5 rounded-full border border-primary/30" />
                  </div>
                </div>
                <span className="font-medium">
                  {locationLoading
                    ? 'Getting your location...'
                    : 'Loading nearby places...'}
                </span>
              </div>
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>

          {/* Corner decorative elements */}
          <div className="absolute top-3 left-3 w-2 h-2 bg-blue-400/60 rounded-full animate-pulse" />
          <div
            className="absolute top-3 right-3 w-2 h-2 bg-indigo-400/60 rounded-full animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute bottom-3 left-3 w-2 h-2 bg-purple-400/60 rounded-full animate-pulse"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute bottom-3 right-3 w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
        </div>

        {/* Custom CSS animations */}
        <style jsx>{`
          @keyframes scan-horizontal {
            0%,
            100% {
              transform: translateX(-100%);
              opacity: 0;
            }
            50% {
              transform: translateX(100%);
              opacity: 1;
            }
          }

          @keyframes scan-vertical {
            0%,
            100% {
              transform: translateY(-100%);
              opacity: 0;
            }
            50% {
              transform: translateY(100%);
              opacity: 1;
            }
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%) skewX(-12deg);
            }
            100% {
              transform: translateX(200%) skewX(-12deg);
            }
          }

          .animate-shimmer {
            animation: shimmer 2s ease-in-out infinite;
          }
        `}</style>
      </Card>
    );
  }

  if (error) {
    return null;
  }

  return (
    <>
      {' '}
      <div className="text-md mb-1 font-bold">Places nearby</div>
      <Card className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-muted/50 to-muted">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-muted/5 to-muted/20 z-10 pointer-events-none rounded-xl" />

        {/* Main Container - Similar to unified-map-view */}
        <div className="h-[500px] flex overflow-hidden">
          {/* Map Container */}
          <div className="flex-1 relative">
            <MapView
              places={places}
              hoveredPlaceId={hoveredPlaceId}
              selectedPlaceId={selectedPlace?.id || null}
              onPlaceHover={setHoveredPlaceId}
              onPlaceSelect={(placeId) => {
                const place = places.find((p) => p.id === placeId);
                setSelectedPlace(place || null);
              }}
              isLoading={isLoading}
            />

            {/* Smaller Floating Cards - Hidden on small screens */}
            <div className="hidden md:block">
              <AnimatePresence>
                {visibleFloatingCards.map((place, index) => (
                  <motion.div
                    key={`${place.id}-${index}`}
                    className="absolute z-20 w-56"
                    style={{
                      left: '20px',
                      top: `${15 + index * 25}%`,
                      transform: `translate(${place.position.x}px, ${place.position.y}px)`,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, x: -100 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.2,
                      transform: { duration: 20, ease: 'easeInOut' },
                    }}
                  >
                    <Card className="shadow-md hover:shadow-lg transition-shadow bg-background/95 backdrop-blur-sm mb-2 relative group">
                      {/* Close Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-background border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFloatingCard(place.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>

                      <div className="p-2.5 flex items-center gap-2">
                        {place.main_image ? (
                          <div className="w-12 h-12 relative flex-shrink-0">
                            <SafeImage
                              src={place.main_image}
                              alt={place.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {place.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {place.location.street_address ||
                              place.location.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            {place.rate_average && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">
                                  {place.rate_average.toFixed(1)}
                                </span>
                              </div>
                            )}
                            <Link
                              href={getPlaceDetailsUrl(place)}
                              className="text-xs text-primary hover:underline font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="relative">
            {/* Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute left-0 top-4 z-10 h-10 w-10 p-0 border-2 bg-background/95 backdrop-blur-sm shadow-lg"
              style={{ transform: 'translateX(-50%)' }}
            >
              {isSidebarCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {/* Sidebar Content */}
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.div
                  key="sidebar"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="border-l border-border bg-background/50 backdrop-blur-sm flex flex-col overflow-hidden h-full"
                >
                  {/* Sidebar Header */}
                  <div className="p-4 border-b border-border flex-shrink-0">
                    <div className="ml-6">
                      <h3 className="font-semibold text-md">Nearby Places</h3>
                      <p className="text-xs text-muted-foreground">
                        {places.length} places found
                      </p>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <ScrollArea className="flex-1 h-[calc(100vh-100px)]">
                    <div className="p-4 space-y-3">
                      {placesWithMetadata.map((place, index) => (
                        <motion.div
                          key={`${place.id}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className={cn(
                            'border rounded-lg overflow-hidden transition-all duration-200 cursor-pointer',
                            hoveredPlaceId === place.id ||
                              selectedPlace?.id === place.id
                              ? 'border-primary shadow-md'
                              : 'border-border hover:border-primary/50'
                          )}
                          onMouseEnter={() => setHoveredPlaceId(place.id)}
                          onMouseLeave={() => setHoveredPlaceId(null)}
                          onClick={() => {
                            // Find the original place without extra metadata
                            const originalPlace = places.find(
                              (p) => p.id === place.id
                            );
                            setSelectedPlace(originalPlace || null);
                          }}
                        >
                          <div className="flex">
                            {/* Place Image */}
                            <div className="w-20 h-20 relative flex-shrink-0 bg-muted">
                              {place.main_image ? (
                                <SafeImage
                                  src={place.main_image}
                                  alt={place.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                  <MapPin className="w-6 h-6 text-primary/40" />
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
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-50 text-green-700 border-green-200 px-1 py-0"
                                    >
                                      P
                                    </Badge>
                                  </div>
                                </div>
                                <div className="ml-2 flex items-center gap-1">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      place.isOpen
                                        ? 'bg-green-500'
                                        : 'bg-red-500'
                                    }`}
                                  />
                                  <span
                                    className={`text-xs font-medium ${
                                      place.isOpen
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}
                                  >
                                    {place.isOpen ? 'Open' : 'Closed'}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {place.location.street_address ||
                                  place.location.name}
                              </p>

                              <div className="flex items-center justify-between mt-2">
                                {place.rate_average && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    <span className="text-xs font-medium">
                                      {place.rate_average.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({place.rate_count || 0})
                                    </span>
                                  </div>
                                )}

                                <div className="text-xs text-muted-foreground font-medium">
                                  {place.distance}
                                </div>
                              </div>

                              {place.category && (
                                <Badge
                                  variant="secondary"
                                  className="mt-2 text-xs"
                                >
                                  {place.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* No Places Indicator */}
        {!isLoading && (!places || places.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground bg-background/90 px-4 py-2 rounded-full">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">No places found nearby</span>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
