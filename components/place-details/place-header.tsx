'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { PlaceResults } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Share2,
  MapPin,
  Star,
  Clock,
  Camera,
  ChevronLeft,
  Navigation,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  getRatingLabel,
  getPriceLevelLabel,
  getOpenStatusColor,
  formatOpenStatus,
  getGlassBackground,
  getMutedBackground,
} from '@/lib/utils/place-utils';
import { patterns } from '@/components/patterns';

interface PlaceHeaderProps {
  place: PlaceResults;
}

// Session storage utilities
const SEARCH_CACHE_KEY = 'placia_search_state';
const NAVIGATION_SOURCE_KEY = 'placia_navigation_source';

const getNavigationSource = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(NAVIGATION_SOURCE_KEY);
};

const restoreSearchState = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const cached = sessionStorage.getItem(SEARCH_CACHE_KEY);
    if (!cached) return false;

    const searchState = JSON.parse(cached);

    // Check if cache is not too old (24 hours)
    const cacheAge = Date.now() - (searchState.timestamp || 0);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (cacheAge > maxAge) {
      sessionStorage.removeItem(SEARCH_CACHE_KEY);
      return false;
    }

    // Store the search state for the home page to restore
    sessionStorage.setItem('placia_restore_search', 'true');
    return true;
  } catch (error) {
    console.warn('Failed to restore search state from session storage:', error);
    return false;
  }
};

export function PlaceHeader({ place }: PlaceHeaderProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPatternIndex, setSelectedPatternIndex] = useState<number>(0);
  const router = useRouter();

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Get localStorage key for this place's pattern
  const getPatternStorageKey = (placeId: string) => `place-pattern-${placeId}`;

  // Load saved pattern from localStorage or set random default
  useEffect(() => {
    const storageKey = getPatternStorageKey(place.id);
    const savedPatternIndex = localStorage.getItem(storageKey);

    if (savedPatternIndex !== null) {
      setSelectedPatternIndex(parseInt(savedPatternIndex, 10));
    } else {
      // Set random pattern as default for new places
      const randomIndex = Math.floor(Math.random() * patterns.length);
      setSelectedPatternIndex(randomIndex);
    }
  }, [place.id]);

  // Save pattern preference to localStorage
  useEffect(() => {
    if (selectedPatternIndex !== null) {
      const storageKey = getPatternStorageKey(place.id);
      localStorage.setItem(storageKey, selectedPatternIndex.toString());
    }
  }, [selectedPatternIndex, place.id]);

  // Get the current pattern component
  const CurrentPattern = useMemo(() => {
    return patterns[selectedPatternIndex] || patterns[0];
  }, [selectedPatternIndex]);

  // Function to cycle to next pattern
  const switchToNextPattern = () => {
    setSelectedPatternIndex((prev) => (prev + 1) % patterns.length);
  };

  // Smart navigation handler using session storage directly
  const handleSmartNavigation = () => {
    const navigationSource = getNavigationSource();

    if (
      navigationSource === 'general_search' ||
      navigationSource === 'chat_search'
    ) {
      // User came from search, check if we can restore search state
      const canRestore = restoreSearchState();
      if (canRestore) {
        // Navigate to home and let the hero section handle restoration
        router.push('/');
        return;
      }
    }

    // Default navigation - just go back to home
    router.push('/');
  };

  const ratingInfo = getRatingLabel(place.rate_average);
  const priceInfo = getPriceLevelLabel(place.price_level);
  const openStatusColor = getOpenStatusColor(place.open_now);

  const getDirectionsUrl = () => {
    if (!place.location) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}&destination_place_id=${encodeURIComponent(place.name)}`;
  };

  const hasMainImage = place.main_image;

  return (
    <div className="relative">
      {/* Cover image or placeholder */}
      <div className="w-full h-64 md:h-80 lg:h-96 relative overflow-hidden">
        {hasMainImage ? (
          <Image
            src={place.main_image!}
            alt={place.name}
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center bg-muted/20">
            {/* SVG Pattern Background */}
            <div className="absolute inset-0 opacity-30 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover">
              <CurrentPattern />
            </div>

            {/* Overlay content */}
            <div className="relative z-10 text-muted-foreground">
              <Camera className="w-24 h-24 opacity-40" />
            </div>

            {/* Optional gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-background/10 via-transparent to-background/20"></div>
          </div>
        )}

        {/* Smart Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 dark:bg-black/60 backdrop-blur-sm hover:bg-white/100 dark:hover:bg-black/80 shadow-lg border-0"
            onClick={handleSmartNavigation}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {/* Pattern Switcher Button - Only show when no main image */}
          {!hasMainImage && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 dark:bg-black/60 backdrop-blur-sm hover:bg-white/100 dark:hover:bg-black/80 shadow-lg border-0"
              onClick={switchToNextPattern}
              title={`Switch pattern (${selectedPatternIndex + 1}/${patterns.length})`}
            >
              <Palette className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 dark:bg-black/60 backdrop-blur-sm hover:bg-white/100 dark:hover:bg-black/80 shadow-lg border-0"
            onClick={toggleFavorite}
          >
            <Heart
              className={cn(
                'h-4 w-4 mr-1 transition-colors',
                isFavorite && 'fill-red-500 text-red-500'
              )}
            />
            {isFavorite ? 'Saved' : 'Save'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 dark:bg-black/60 backdrop-blur-sm hover:bg-white/100 dark:hover:bg-black/80 shadow-lg border-0"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>

        {/* Enhanced gradient overlay */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/80 to-transparent h-40"></div>
      </div>

      {/* Place info overlay */}
      <div className="container mx-auto px-4 relative -mt-20 z-10">
        <div
          className={cn(
            'flex flex-col md:flex-row md:items-end gap-6 rounded-2xl p-6 shadow-xl border border-primary/20',
            getGlassBackground()
          )}
        >
          <div className="flex items-center gap-6 flex-1 relative">
            {/* Logo */}
            {place.logo && (
              <div className="w-24 h-24 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-background shadow-2xl bg-background ring-4 ring-background/50 absolute md:static -top-16 -left-0 md:-left-6">
                <Image
                  src={place.logo}
                  alt={`${place.name} logo`}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title and basic info */}
            <div className="flex-1 mt-14 md:mt-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {place.name}
              </h1>

              {place.tagline ? (
                <p className="text-muted-foreground text-lg mb-4">
                  {place.tagline}
                </p>
              ) : (
                place.description && (
                  <p className="text-muted-foreground text-lg mb-4">
                    {place.description.slice(0, 100)}...
                  </p>
                )
              )}

              {/* Badges and info */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Category & Subcategory */}
                {place.category && (
                  <Badge
                    variant="outline"
                    className="text-sm font-medium px-3 py-1"
                  >
                    {place.category.name}
                  </Badge>
                )}

                {place.subcategory && (
                  <Badge
                    variant="outline"
                    className="text-sm font-medium px-3 py-1"
                  >
                    {place.subcategory.name}
                  </Badge>
                )}

                {/* Location */}
                <div
                  className={cn(
                    'flex items-center text-sm text-muted-foreground rounded-full px-3 py-1',
                    getMutedBackground()
                  )}
                >
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {place.location?.street_address ||
                      `${place.city?.name || ''}, ${place.region?.name || ''}`}
                  </span>
                </div>
              </div>

              {/* Rating, Status, and Price row */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* Rating */}
                {place.rate_average && (
                  <div
                    className={cn(
                      'flex items-center gap-0 rounded-full px-3 py-1.5',
                      getMutedBackground()
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-sm">
                        {place.rate_average.toFixed(1)}
                      </span>
                      {place.rate_count && (
                        <span className="text-muted-foreground text-xs">
                          ({place.rate_count.toLocaleString()})
                        </span>
                      )}
                    </div>
                    {ratingInfo.label && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs px-2 py-0 border-0 ml-2',
                          ratingInfo.color
                        )}
                      >
                        {ratingInfo.label}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Open status */}
                {place.open_now !== undefined &&
                  place.open_now !== 'unknown' && (
                    <div
                      className={cn(
                        'flex items-center gap-1 rounded-full px-3 py-1.5',
                        getMutedBackground()
                      )}
                    >
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span
                        className={cn('font-medium text-sm', openStatusColor)}
                      >
                        {formatOpenStatus(place.open_now)}
                      </span>
                    </div>
                  )}

                {/* Price level */}
                {place.price_level && priceInfo.symbol && (
                  <div
                    className={cn(
                      'flex items-center gap-0 rounded-full px-3 py-1.5',
                      getMutedBackground()
                    )}
                  >
                    <span className={cn('text-sm font-bold', priceInfo.color)}>
                      {priceInfo.symbol}
                    </span>
                    {priceInfo.label && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs px-2 py-0 border-0 ml-2',
                          priceInfo.color
                        )}
                      >
                        {priceInfo.label}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-3 mt-4 md:mt-0 absolute md:static bottom-4 right-4">
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 shadow-lg px-6 py-2 text-sm font-medium"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
