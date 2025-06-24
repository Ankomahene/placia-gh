'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Loader2, Globe, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlaceResultsSummary } from '@/types/place';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useLocation } from '@/hooks/use-location';
import { MapSidebar } from './shared/MapSidebar';
import { useSearchContext } from '../hooks/use-search-context';

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

const DynamicGoogleMapClient = dynamic(
  () =>
    import('./google-map-view/GoogleMapClient').then(
      (mod) => mod.GoogleMapClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          <p className="text-sm text-muted-foreground">
            Loading Google Maps...
          </p>
        </div>
      </div>
    ),
  }
);

const DynamicMaplibreMapClient = dynamic(
  () =>
    import('./maplibre-view/MaplibreMapClient').then(
      (mod) => mod.MaplibreMapClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          <p className="text-sm text-muted-foreground">Loading MapLibre...</p>
        </div>
      </div>
    ),
  }
);

type MapType = 'basic' | 'google' | 'maplibre';

interface UnifiedMapViewProps {
  places: PlaceResultsSummary[];
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
  isLoading: boolean;
}

export function UnifiedMapView({
  places: rawPlaces,
  hoveredPlaceId,
  selectedPlaceId,
  onPlaceHover,
  onPlaceSelect,
  isLoading,
}: UnifiedMapViewProps) {
  const [mapType, setMapType] = useLocalStorage<MapType>('map-type', 'basic');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage(
    'sidebar-collapsed',
    false
  );
  const [flyToMarkerId, setFlyToMarkerId] = useState<string | null>(null);
  const [directionsInfo, setDirectionsInfo] = useState<any>(null);
  const { setNavigationSource } = useSearchContext();

  // Track hover source for popup behavior
  const hoverSourceRef = useRef<'card' | 'marker' | null>(null);

  // Get user location using the hook
  const { latitude, longitude } = useLocation();

  // Client-side deduplication as safety net
  const places = useMemo(() => {
    const seenIds = new Set<string>();
    const deduplicatedPlaces = rawPlaces.filter((place) => {
      if (seenIds.has(place.id)) {
        return false;
      }
      seenIds.add(place.id);
      return true;
    });

    return deduplicatedPlaces;
  }, [rawPlaces]);

  const handleMapPinHover = useCallback(
    (placeId: string | null) => {
      hoverSourceRef.current = placeId ? 'marker' : null;
      onPlaceHover(placeId);
    },
    [onPlaceHover]
  );

  const handleCardHover = useCallback(
    (placeId: string | null) => {
      hoverSourceRef.current = placeId ? 'card' : null;
      onPlaceHover(placeId);
    },
    [onPlaceHover]
  );

  const handleCardClick = useCallback(
    (placeId: string) => {
      onPlaceSelect(placeId);
      setFlyToMarkerId(placeId);
      // Clear directions when selecting a new place
      setDirectionsInfo(null);
      // Clear the flyTo after animation
      setTimeout(() => setFlyToMarkerId(null), 2000);
    },
    [onPlaceSelect]
  );

  const handleDirectionsRequest = useCallback(
    (placeId: string) => {
      const place = places.find((p) => p.id === placeId);
      if (place) {
        // Build Google Maps directions URL
        const destination = `${place.location.lat},${place.location.lng}`;
        const placeName = encodeURIComponent(place.name);

        let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${placeName}`;

        // Add user's current location as origin if available
        if (latitude && longitude) {
          const origin = `${latitude},${longitude}`;
          googleMapsUrl += `&origin=${origin}`;
        }

        window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
      }
    },
    [places, latitude, longitude]
  );

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, [setIsSidebarCollapsed]);

  const handleMapTypeChange = useCallback(
    (newMapType: MapType) => {
      setMapType(newMapType);
    },
    [setMapType]
  );

  // Create markers for the current map type
  const createMarkersForMapType = (type: MapType) => {
    return places.map((place) => {
      const seed = place.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const isOpen = seed % 3 !== 0;
      const distance = ((seed % 47) / 10 + 0.2).toFixed(1);

      return {
        id: place.id,
        position:
          type === 'google' || type === 'maplibre'
            ? { lat: place.location.lat, lng: place.location.lng }
            : ([place.location.lat, place.location.lng] as [number, number]),
        name: place.name,
        isOpen,
        rating: place.rate_average,
        category: place.category?.name || 'Place',
        image: place.main_image,
        address:
          place.location.name || place.formatted_address || place.vicinity,
        distance: `${distance} km`,
      };
    });
  };

  const renderMap = () => {
    if (mapType === 'google') {
      return (
        <DynamicGoogleMapClient
          markers={createMarkersForMapType('google') as any}
          hoveredMarkerId={hoveredPlaceId}
          selectedMarkerId={selectedPlaceId}
          onMarkerHover={handleMapPinHover}
          onMarkerClick={handleCardClick}
          flyToMarkerId={flyToMarkerId}
          userLocation={
            latitude && longitude ? { lat: latitude, lng: longitude } : null
          }
          directionsInfo={directionsInfo}
          onDirectionsRequest={handleDirectionsRequest}
        />
      );
    }

    if (mapType === 'maplibre') {
      return (
        <DynamicMaplibreMapClient
          markers={createMarkersForMapType('maplibre') as any}
          hoveredMarkerId={hoveredPlaceId}
          selectedMarkerId={selectedPlaceId}
          onMarkerHover={handleMapPinHover}
          onMarkerClick={handleCardClick}
          flyToMarkerId={flyToMarkerId}
          isSidebarCollapsed={isSidebarCollapsed}
          hoverSource={hoverSourceRef.current}
          setNavigationSource={setNavigationSource}
        />
      );
    }

    return (
      <DynamicSearchMap
        markers={createMarkersForMapType('basic') as any}
        hoveredMarkerId={hoveredPlaceId}
        selectedMarkerId={selectedPlaceId}
        onMarkerHover={handleMapPinHover}
        onMarkerClick={handleCardClick}
        flyToMarkerId={flyToMarkerId}
        isSidebarCollapsed={isSidebarCollapsed}
        hoverSource={hoverSourceRef.current}
        setNavigationSource={setNavigationSource}
      />
    );
  };

  if (places.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-16 w-16 text-muted-foreground mx-auto mb-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-full h-full"
            >
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
          className="w-full h-full rounded-xl overflow-hidden border border-border relative"
        >
          {/* Map Type Switcher */}
          <div className="absolute top-4 left-4 z-10 flex gap-1 bg-background/95 backdrop-blur-sm rounded-lg border border-border/50 p-1 shadow-lg">
            <Button
              variant={mapType === 'basic' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMapTypeChange('basic')}
              className="px-3 py-1.5 h-auto text-xs"
            >
              <MapIcon className="h-3 w-3 mr-1" />
              Map 1
            </Button>
            <Button
              variant={mapType === 'google' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMapTypeChange('google')}
              className="px-3 py-1.5 h-auto text-xs"
            >
              <Globe className="h-3 w-3 mr-1" />
              Map 2
            </Button>
            <Button
              variant={mapType === 'maplibre' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMapTypeChange('maplibre')}
              className="px-3 py-1.5 h-auto text-xs"
            >
              <MapIcon className="h-3 w-3 mr-1" />
              Map 3
            </Button>
          </div>

          {/* Map Type Badge */}
          <div className="absolute top-4 right-14 z-10">
            <Badge
              variant="secondary"
              className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg"
            >
              {mapType === 'google'
                ? 'Map 2'
                : mapType === 'maplibre'
                  ? 'Map 3'
                  : 'Map 1'}
            </Badge>
          </div>

          {renderMap()}
        </motion.div>
      </div>

      {/* Unified Sidebar */}
      <MapSidebar
        places={places}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        hoveredPlaceId={hoveredPlaceId}
        selectedPlaceId={selectedPlaceId}
        onPlaceHover={handleCardHover}
        onPlaceClick={handleCardClick}
        onDirectionsRequest={handleDirectionsRequest}
        isLoading={isLoading}
        setNavigationSource={setNavigationSource}
      />
    </div>
  );
}
