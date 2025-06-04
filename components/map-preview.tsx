'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useLocation } from '@/hooks/use-location';
import { featuredPlaces } from '@/lib/mock-data';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load the map component with optimized loading
const DynamicMap = dynamic(() => import('@/components/map/dynamic-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-muted/20 to-muted/10 animate-pulse rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading interactive map...</span>
      </div>
    </div>
  ),
});

// Mock nearby places with varied coordinates around Accra
const generateNearbyPlaces = (userLat: number, userLng: number) => [
  {
    id: 'nearby-1',
    name: 'Buka Restaurant',
    position: [userLat + 0.01, userLng + 0.005] as [number, number],
    rating: 4.7,
    isOpen: true,
    category: 'Restaurant',
    distance: '200m',
    phone: '+233 24 123 4567',
    image:
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?w=100&h=100&fit=crop&crop=center',
  },
  {
    id: 'nearby-2',
    name: 'Pharmacy Plus',
    position: [userLat - 0.008, userLng + 0.012] as [number, number],
    rating: 4.5,
    isOpen: true,
    category: 'Pharmacy',
    distance: '350m',
    phone: '+233 24 234 5678',
    image:
      'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?w=100&h=100&fit=crop&crop=center',
  },
  {
    id: 'nearby-3',
    name: "St. Mary's Church",
    position: [userLat + 0.005, userLng - 0.015] as [number, number],
    rating: 4.8,
    isOpen: false,
    category: 'Church',
    distance: '500m',
    phone: '+233 24 345 6789',
    image:
      'https://images.pexels.com/photos/208271/pexels-photo-208271.jpeg?w=100&h=100&fit=crop&crop=center',
  },
  {
    id: 'nearby-4',
    name: 'GCB Bank',
    position: [userLat - 0.003, userLng - 0.008] as [number, number],
    rating: 4.2,
    isOpen: true,
    category: 'Bank',
    distance: '150m',
    phone: '+233 24 456 7890',
    image:
      'https://images.pexels.com/photos/259200/pexels-photo-259200.jpeg?w=100&h=100&fit=crop&crop=center',
  },
  {
    id: 'nearby-5',
    name: "Mama's Chop Bar",
    position: [userLat + 0.012, userLng + 0.008] as [number, number],
    rating: 4.4,
    isOpen: true,
    category: 'Local Food',
    distance: '400m',
    phone: '+233 24 567 8901',
    image:
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=100&h=100&fit=crop&crop=center',
  },
];

interface HoverCardProps {
  place: any;
  onClose: () => void;
}

const PlaceHoverCard = ({ place, onClose }: HoverCardProps) => (
  <Card className="absolute z-50 w-72 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm animate-scale-in">
    <CardContent className="p-4">
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={place.image}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 truncate">{place.name}</h3>
          <div className="flex items-center gap-1 mb-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs text-muted-foreground">
              {place.rating}
            </span>
          </div>
          <Badge
            variant={place.isOpen ? 'default' : 'secondary'}
            className={cn(
              'text-xs h-5',
              place.isOpen
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-gray-500/10'
            )}
          >
            <Clock className="h-2 w-2 mr-1" />
            {place.isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {place.distance}
        </span>
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          Call
        </span>
      </div>
    </CardContent>
  </Card>
);

export function MapPreview() {
  const { latitude, longitude, loading: locationLoading } = useLocation();
  const [hoveredPlace, setHoveredPlace] = useState<any>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Default to Accra center if no location
  const mapCenter: [number, number] = useMemo(
    () => [latitude || 5.6037, longitude || -0.187],
    [latitude, longitude]
  );

  // Generate nearby places based on user location
  const nearbyPlaces = useMemo(() => {
    if (latitude && longitude) {
      return generateNearbyPlaces(latitude, longitude);
    }
    return [];
  }, [latitude, longitude]);

  // Combine featured places with nearby places
  const allMapLocations = useMemo(
    () => [
      // User location marker (if available)
      ...(latitude && longitude
        ? [
            {
              id: 'user-location',
              name: 'You are here',
              position: [latitude, longitude] as [number, number],
              isUserLocation: true,
              isOpen: true,
              rating: 0,
            },
          ]
        : []),
      // Nearby places
      ...nearbyPlaces,
      // Featured places with fixed coordinates
      ...featuredPlaces.map((place, index) => ({
        id: place.id,
        name: place.name,
        position: [
          5.6037 + index * 0.01 - 0.02,
          -0.187 + index * 0.008 - 0.015,
        ] as [number, number],
        isOpen: place.isOpen,
        rating: place.rating,
        category: place.category,
      })),
    ],
    [latitude, longitude, nearbyPlaces]
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full relative" onMouseMove={handleMouseMove}>
      {/* Main map container */}
      <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-primary/10 dark:border-primary/20">
        <div className="w-full h-64 md:h-80 lg:h-96 relative">
          <DynamicMap
            center={mapCenter}
            zoom={latitude && longitude ? 15 : 13}
            locations={allMapLocations}
            className="h-full w-full"
            onMarkerHover={setHoveredPlace}
            userLocation={
              latitude && longitude
                ? { lat: latitude, lng: longitude }
                : undefined
            }
          />

          {/* Loading overlay for location */}
          {locationLoading && (
            <div className="absolute top-4 left-4 z-30">
              <Card className="px-3 py-2 bg-card/90 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Finding your location...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Hover card */}
      {hoveredPlace && hoveredPlace.id !== 'user-location' && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 100,
            transform:
              mousePosition.x > window.innerWidth - 300
                ? 'translateX(-290px)'
                : 'none',
          }}
        >
          <PlaceHoverCard
            place={hoveredPlace}
            onClose={() => setHoveredPlace(null)}
          />
        </div>
      )}

      {/* Floating info cards */}
      <div className="absolute -top-6 -left-2 md:top-8 md:-left-8 p-4 bg-card/95 backdrop-blur-sm rounded-xl shadow-lg border border-border max-w-[200px] animate-float z-40">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/40 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium text-sm">Live Location</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {latitude && longitude
            ? 'Real-time places near you'
            : 'Enable location for personalized results'}
        </p>
      </div>

      <div className="absolute -bottom-6 -right-6 md:bottom-8 md:-right-10 p-4 bg-card/95 backdrop-blur-sm rounded-xl shadow-lg border border-border max-w-[200px] animate-float-delayed z-20">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </div>
          <span className="font-medium text-sm">Smart Results</span>
        </div>
        <p className="text-xs text-muted-foreground">
          AI-curated places matching your preferences
        </p>
      </div>
    </div>
  );
}
