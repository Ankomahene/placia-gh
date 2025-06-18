'use client';

import { PlaceResultsSummary } from '@/types/place';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

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
  places: PlaceResultsSummary[];
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
  // Track which place is being clicked for map flying
  const [flyToMarkerId, setFlyToMarkerId] = useState<string | null>(null);

  const handleMapPinHover = (placeId: string | null) => {
    if (selectedPlaceId !== placeId) {
      onPlaceSelect('');
    }
    onPlaceHover(placeId); // Only update the hover state
  };

  // Handle card click - fly to the selected place
  const handleCardClick = (placeId: string) => {
    onPlaceSelect(placeId);
    // Trigger map fly to marker when clicking card
    setFlyToMarkerId(placeId);
    // Clear the flyTo after animation
    setTimeout(() => setFlyToMarkerId(null), 2000);
  };

  // Convert places to map markers with stable data
  const mapMarkers = places.map((place) => {
    // Generate stable data based on place ID
    const seed = place.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const isOpen = seed % 3 !== 0; // ~67% open rate
    const distance = ((seed % 47) / 10 + 0.2).toFixed(1); // 0.2-4.9 km range

    return {
      id: place.id,
      position: [place.location.lat, place.location.lng] as [number, number],
      name: place.name,
      isOpen,
      rating: place.rate_average,
      category: place.category?.name || 'Place',
      image: place.main_image,
      address: place.location.name || place.formatted_address || place.vicinity,
      distance: `${distance} km`,
    };
  });

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
        <div className="w-full h-full rounded-xl overflow-hidden border border-border">
          <DynamicSearchMap
            markers={mapMarkers}
            hoveredMarkerId={hoveredPlaceId}
            selectedMarkerId={selectedPlaceId}
            onMarkerHover={handleMapPinHover}
            onMarkerClick={handleCardClick}
            flyToMarkerId={flyToMarkerId}
          />
        </div>
      </div>
    </div>
  );
}
