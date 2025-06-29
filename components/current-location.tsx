import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, RotateCw, Locate, Settings } from 'lucide-react';
import { useLocation } from '@/hooks/use-location';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { LocationPicker } from '@/components/location-picker';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { MatchedLocation } from '@/lib/services/location-matching';

export function CurrentLocation() {
  const {
    address,
    error,
    loading,
    latitude,
    longitude,
    refetch,
    setManualLocation,
    clearManualLocation,
    isManualLocation,
  } = useLocation();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRefetch = async () => {
    try {
      setIsUpdating(true);
      await refetch();
    } catch (err) {
      console.error('❌ Location refetch failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualLocationSelect = async (location: MatchedLocation) => {
    try {
      setIsUpdating(true);

      // Convert MatchedLocation to ManualLocationOverride format
      await setManualLocation({
        latitude: location.location.lat,
        longitude: location.location.lng,
        address:
          location.location.street_address ||
          location.location.name ||
          'Selected Location',
      });

      setIsPopoverOpen(false);
    } catch (err) {
      console.error('❌ Manual location setting failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearManualLocation = async () => {
    try {
      setIsUpdating(true);
      await clearManualLocation();
      setIsPopoverOpen(false);
    } catch (err) {
      console.error('❌ Clear manual location failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isLoading = loading || isUpdating;

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Detecting location...</span>
        </Badge>
        <Locate className="h-3 w-3 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-1">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20 cursor-pointer"
                  >
                    <MapPin className="h-3 w-3 text-destructive" />
                    <span className="text-xs">Location unavailable</span>
                    <Settings className="h-3 w-3 ml-1 text-muted-foreground" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to select location manually</p>
                </TooltipContent>
              </Tooltip>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Select Your Location</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefetch}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Locate className="h-4 w-4 mr-2" />
                      Try GPS Again
                    </>
                  )}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">{error}</div>

              <LocationPicker
                showMap={true}
                mapHeight="200px"
                enableDatabaseMatching={false}
                onChange={handleManualLocationSelect}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
            <Badge
              variant="outline"
              className={cn(
                'flex items-center gap-1 w-[250px] truncate cursor-pointer hover:bg-primary/10 transition-colors',
                isManualLocation
                  ? 'bg-blue-500/10 border-blue-500/20 dark:bg-blue-400/10 dark:border-blue-400/20'
                  : 'bg-primary/5'
              )}
            >
              <MapPin
                className={cn(
                  'h-3 w-3',
                  isManualLocation
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-primary'
                )}
              />
              <span
                className="text-xs w-full truncate"
                title={address || 'Location not found'}
              >
                {address || 'Location not found'}
              </span>
              {isManualLocation && (
                <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                  📍
                </span>
              )}
              <Settings className="h-3 w-3 ml-1 text-muted-foreground" />
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {isManualLocation ? 'Update Location' : 'Current Location'}
              </h4>
              <div className="flex gap-2">
                {isManualLocation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearManualLocation}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Use GPS'
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefetch}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RotateCw className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isManualLocation && (
              <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 p-2 rounded">
                📍 You have manually set this location
              </div>
            )}

            <LocationPicker
              value={{
                location:
                  latitude && longitude
                    ? {
                        lat: latitude,
                        lng: longitude,
                        name: address || 'Current Location',
                        street_address: address || '',
                      }
                    : undefined,
              }}
              showMap={true}
              mapHeight="200px"
              enableDatabaseMatching={false}
              onChange={handleManualLocationSelect}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
