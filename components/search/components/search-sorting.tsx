'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpDown,
  Navigation,
  Star,
  DollarSign,
  MapPin,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/hooks/use-location';
import { LocationSearchInput } from '@/components/location-picker/location-search-input';
import {
  geocodeAddress,
  type LocationComponents,
} from '@/lib/services/location-matching';
import {
  SortConfig,
  SortingCapabilities,
  SortType,
  ProximitySortOrder,
  RatingSortOrder,
  PriceLevelSortOrder,
  NameSortOrder,
} from '../types';

interface SearchSortingProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  capabilities: SortingCapabilities;
  className?: string;
}

interface SortOption {
  type: SortType;
  label: string;
  icon: React.ReactNode;
  orders: { value: string; label: string; icon?: React.ReactNode }[];
  disabled?: boolean;
  requiresLocation?: boolean;
}

export function SearchSorting({
  sortConfig,
  onSortChange,
  capabilities,
  className,
}: SearchSortingProps) {
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [pendingSortConfig, setPendingSortConfig] = useState<SortConfig | null>(
    null
  );
  const [customLocationSearch, setCustomLocationSearch] = useState('');
  const [isProcessingLocation, setIsProcessingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const {
    latitude: userLat,
    longitude: userLng,
    loading: locationLoading,
    error: userLocationError,
    refetch: detectLocation,
  } = useLocation();

  const sortOptions: SortOption[] = useMemo(
    () => [
      {
        type: 'none',
        label: 'Default',
        icon: <ArrowUpDown className="h-4 w-4" />,
        orders: [{ value: 'default', label: 'Default order' }],
      },
      {
        type: 'proximity',
        label: 'Distance',
        icon: <MapPin className="h-4 w-4" />,
        orders: [
          {
            value: 'nearest_first',
            label: 'Nearest first',
            icon: <ArrowUp className="h-3 w-3" />,
          },
          {
            value: 'farthest_first',
            label: 'Farthest first',
            icon: <ArrowDown className="h-3 w-3" />,
          },
        ],
        disabled: !capabilities.canSortByProximity,
        requiresLocation: capabilities.needsLocationForProximity,
      },
      {
        type: 'rating',
        label: 'Rating',
        icon: <Star className="h-4 w-4" />,
        orders: [
          {
            value: 'highest_first',
            label: 'Highest rated',
            icon: <ArrowUp className="h-3 w-3" />,
          },
          {
            value: 'lowest_first',
            label: 'Lowest rated',
            icon: <ArrowDown className="h-3 w-3" />,
          },
        ],
        disabled: !capabilities.canSortByRating,
      },
      {
        type: 'price_level',
        label: 'Price',
        icon: <DollarSign className="h-4 w-4" />,
        orders: [
          {
            value: 'cheapest_first',
            label: 'Cheapest first',
            icon: <ArrowUp className="h-3 w-3" />,
          },
          {
            value: 'most_expensive_first',
            label: 'Most expensive',
            icon: <ArrowDown className="h-3 w-3" />,
          },
        ],
        disabled: !capabilities.canSortByPriceLevel,
      },
      {
        type: 'name',
        label: 'Name',
        icon: <ArrowUpDown className="h-4 w-4" />,
        orders: [
          {
            value: 'a_to_z',
            label: 'A to Z',
            icon: <ArrowUp className="h-3 w-3" />,
          },
          {
            value: 'z_to_a',
            label: 'Z to A',
            icon: <ArrowDown className="h-3 w-3" />,
          },
        ],
      },
    ],
    [capabilities]
  );

  const currentSortOption = sortOptions.find(
    (option) => option.type === sortConfig.type
  );
  const currentOrderOption = currentSortOption?.orders.find(
    (order) => order.value === sortConfig.order
  );

  const handleSortTypeChange = (type: SortType) => {
    const option = sortOptions.find((o) => o.type === type);
    if (!option || option.disabled) return;

    const defaultOrder = option.orders[0].value;
    const newConfig: SortConfig = {
      type,
      order: defaultOrder as any,
    };

    // Check if this sort type requires location and we don't have it
    if (option.requiresLocation && capabilities.needsLocationForProximity) {
      setPendingSortConfig(newConfig);
      setIsLocationDialogOpen(true);
    } else {
      onSortChange(newConfig);
    }
  };

  const handleSortOrderChange = (order: string) => {
    onSortChange({
      ...sortConfig,
      order: order as any,
    });
  };

  const handleUseCurrentLocation = async () => {
    if (userLat != null && userLng != null) {
      const config = pendingSortConfig || sortConfig;
      onSortChange({
        ...config,
        customLocation: { lat: userLat, lng: userLng, name: 'Your location' },
      });
      setIsLocationDialogOpen(false);
      setPendingSortConfig(null);
    } else {
      detectLocation();
    }
  };

  const handleLocationSelect = async (location: LocationComponents) => {
    try {
      setIsProcessingLocation(true);
      setLocationError(null);

      const config = pendingSortConfig || sortConfig;
      onSortChange({
        ...config,
        customLocation: {
          lat: location.latitude,
          lng: location.longitude,
          name: location.address || `${location.city}, ${location.country}`,
        },
      });

      setIsLocationDialogOpen(false);
      setPendingSortConfig(null);
      setCustomLocationSearch('');
    } catch (error) {
      setLocationError('Failed to process selected location');
    } finally {
      setIsProcessingLocation(false);
    }
  };

  const getSortLabel = () => {
    if (sortConfig.type === 'none') return 'Sort';

    const type = currentSortOption?.label || 'Unknown';
    const order = currentOrderOption?.label || '';
    return `${type}: ${order}`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Sort Type Selector */}
      <Select
        value={sortConfig.type}
        onValueChange={(value) => handleSortTypeChange(value as SortType)}
      >
        <SelectTrigger className="h-9 px-1 sm:px-2 text-xs sm:text-sm">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem
              key={option.type}
              value={option.type}
              disabled={option.disabled}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
                {option.disabled && (
                  <Badge variant="secondary" className="text-xs">
                    N/A
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort Order Selector (only shown if not 'none') */}
      {sortConfig.type !== 'none' && currentSortOption && (
        <Select value={sortConfig.order} onValueChange={handleSortOrderChange}>
          <SelectTrigger className="h-9 px-1 sm:px-2 text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currentSortOption.orders.map((order) => (
              <SelectItem key={order.value} value={order.value}>
                <div className="flex items-center gap-2">
                  {order.icon}
                  <span>{order.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Location info for proximity sorting */}
      {sortConfig.type === 'proximity' && sortConfig.customLocation && (
        <Badge variant="outline" className="text-xs">
          <MapPin className="h-3 w-3 mr-1" />
          {sortConfig.customLocation.name}
        </Badge>
      )}

      {/* Location Selection Dialog */}
      <Dialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Location for Distance Sorting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To sort by distance, please choose a reference location:
            </p>

            {/* Use Current Location */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Use Current Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading}
                  className="w-full"
                >
                  {locationLoading ? 'Detecting...' : 'Use My Location'}
                </Button>
                {userLocationError && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {userLocationError}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Custom Location Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Choose Custom Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationSearchInput
                  value={customLocationSearch}
                  onChange={setCustomLocationSearch}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Search for a location..."
                  disabled={isProcessingLocation}
                />
                {locationError && (
                  <Alert className="mt-2" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {locationError}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsLocationDialogOpen(false);
                  setPendingSortConfig(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
