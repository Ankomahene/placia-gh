'use client';

import { useEffect, useState } from 'react';
import { PlaceResults } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(
  () => import('./map-component').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-muted animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

interface PlaceMapProps {
  place: PlaceResults;
}

export function PlaceMap({ place }: PlaceMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const getDirectionsUrl = () => {
    if (!place.location) return '#';
    
    return `https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}&destination_place_id=${encodeURIComponent(place.name)}`;
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Map container */}
        <div className="h-64 w-full relative">
          {isMounted && (
            <DynamicMap 
              latitude={place.location?.lat} 
              longitude={place.location?.lng}
              name={place.name}
            />
          )}
        </div>
        
        {/* Address and directions */}
        <div className="p-4 space-y-3">
          <p className="text-sm">
            {place.location?.street_address || 
             `${place.city?.name || ''}, ${place.region?.name || ''}`}
          </p>
          
          <a 
            href={getDirectionsUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="w-full">
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}