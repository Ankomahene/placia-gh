'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, RefreshCw, AlertCircle } from 'lucide-react';
import { LocationSearchInput } from './location-search-input';
import { useLocation } from '@/hooks/use-location';
import {
  reverseGeocode,
  matchLocationToDatabase,
  type LocationComponents,
  type MatchedLocation,
} from '@/lib/services/location-matching';

// Dynamically import the map component to avoid SSR issues
const LocationMap = dynamic(
  () => import('./location-map').then((mod) => ({ default: mod.LocationMap })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted rounded-md flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    ),
  }
);

interface LocationPickerProps {
  value?: {
    country_id?: string;
    region_id?: string;
    city_id?: string;
    town_id?: string;
    location?: {
      lng: number;
      lat: number;
      name: string;
      street_address: string;
    };
  };
  onChange?: (location: MatchedLocation) => void;
  className?: string;
  showMap?: boolean;
  mapHeight?: string;
  required?: boolean;
  error?: string;
}

export function LocationPicker({
  value,
  onChange,
  className,
  showMap = true,
  mapHeight = '300px',
  required = false,
  error,
}: LocationPickerProps) {
  const [searchValue, setSearchValue] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(
    value?.location
      ? { lat: value.location.lat, lng: value.location.lng }
      : null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchedData, setMatchedData] = useState<MatchedLocation | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const isUpdatingFromSearch = useRef(false);

  const {
    latitude: userLat,
    longitude: userLng,
    loading: locationLoading,
    error: locationError,
    refetch: detectLocation,
  } = useLocation();

  // Initialize with existing value
  useEffect(() => {
    if (value?.location) {
      setCurrentLocation({ lat: value.location.lat, lng: value.location.lng });
      const locationName =
        value.location.name || value.location.street_address || '';
      if (!searchValue && locationName) {
        setSearchValue(locationName);
      }
    }
  }, [value, searchValue]);

  const processLocation = async (
    lat: number,
    lng: number,
    components?: LocationComponents,
    skipSearchUpdate = false
  ) => {
    setIsProcessing(true);
    setProcessingError(null);

    try {
      let locationComponents = components;

      if (!locationComponents) {
        const geocodeResult = await reverseGeocode(lat, lng);
        if (!geocodeResult) {
          throw new Error('Could not determine location details');
        }
        locationComponents = geocodeResult;
      }

      const matched = await matchLocationToDatabase(locationComponents);
      setMatchedData(matched);
      onChange?.(matched);

      // Only update search value if not skipping and no existing search value
      if (!skipSearchUpdate && locationComponents.address && !searchValue) {
        setSearchValue(locationComponents.address);
      }
    } catch (error) {
      console.error('Location processing error:', error);
      setProcessingError(
        error instanceof Error ? error.message : 'Failed to process location'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchLocationSelect = (location: LocationComponents) => {
    isUpdatingFromSearch.current = true;
    setCurrentLocation({ lat: location.latitude, lng: location.longitude });
    // Skip search update since we already have the search value set
    processLocation(location.latitude, location.longitude, location, true);
    // Reset the flag after a delay to allow processing to complete
    setTimeout(() => {
      isUpdatingFromSearch.current = false;
    }, 100);
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    processLocation(lat, lng);
  };

  const handleUseCurrentLocation = () => {
    if (userLat != null && userLng != null) {
      setCurrentLocation({ lat: userLat, lng: userLng });
      processLocation(userLat, userLng);
    } else {
      detectLocation();
    }
  };

  // Auto-use detected location if available and no current location set
  useEffect(() => {
    if (
      userLat != null &&
      userLng != null &&
      !currentLocation &&
      !value?.location
    ) {
      setCurrentLocation({ lat: userLat, lng: userLng });
      processLocation(userLat, userLng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLat, userLng, currentLocation, value]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Location {required && <span className="text-red-500">*</span>}
        </label>

        <div className="flex gap-2">
          <div className="flex-1">
            <LocationSearchInput
              value={searchValue}
              onChange={setSearchValue}
              onLocationSelect={handleSearchLocationSelect}
              placeholder="Search for a location..."
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleUseCurrentLocation}
            disabled={locationLoading || isProcessing}
            className="flex-shrink-0"
          >
            {locationLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {locationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}
        {processingError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{processingError}</AlertDescription>
          </Alert>
        )}
      </div>

      {showMap && (
        <LocationMap
          latitude={currentLocation?.lat}
          longitude={currentLocation?.lng}
          onLocationChange={handleMapLocationChange}
          height={mapHeight}
          draggable={!isProcessing}
        />
      )}

      {matchedData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Selected Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Coordinates:</span>
                <div className="font-mono">
                  {matchedData.location.lat.toFixed(6)},{' '}
                  {matchedData.location.lng.toFixed(6)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Address:</span>
                <div className="truncate">
                  {matchedData.location.street_address}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Detected Location:
              </div>
              <div className="flex flex-wrap gap-1">
                {matchedData.components.country && (
                  <Badge
                    variant={matchedData.country_id ? 'default' : 'secondary'}
                  >
                    {matchedData.components.country}
                    {matchedData.country_id && ' ✓'}
                  </Badge>
                )}
                {matchedData.components.region && (
                  <Badge
                    variant={matchedData.region_id ? 'default' : 'secondary'}
                  >
                    {matchedData.components.region}
                    {matchedData.region_id && ' ✓'}
                  </Badge>
                )}
                {matchedData.components.city && (
                  <Badge
                    variant={matchedData.city_id ? 'default' : 'secondary'}
                  >
                    {matchedData.components.city}
                    {matchedData.city_id && ' ✓'}
                  </Badge>
                )}
              </div>

              {(!matchedData.country_id ||
                !matchedData.region_id ||
                !matchedData.city_id) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Some location components couldn&apos;t be matched to your
                    database. You may need to manually select them in the form.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
