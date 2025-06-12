'use client';

import { useState } from 'react';
import {
  Save,
  X,
  AlertCircle,
  Check,
  MoreHorizontal,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlaceCard } from './PlaceCard';
import { LocationMappingModal } from './LocationMappingModal';
import { MappedPlace } from '../types';

interface LocationMapping {
  place_id: string;
  country_id: string;
  region_id: string;
  city_id: string;
}

interface PlaceResultsProps {
  places: MappedPlace[];
  error: string | null;
  onSaveSelected: (
    selectedPlaces: MappedPlace[],
    mappings?: LocationMapping[]
  ) => void;
  onLoadMore: () => void;
  saving: boolean;
  hasMore: boolean;
  totalLoaded: number;
  loading: boolean;
}

export function PlaceResults({
  places,
  error,
  onSaveSelected,
  onLoadMore,
  saving,
  hasMore,
  totalLoaded,
  loading,
}: PlaceResultsProps) {
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(
    new Set()
  );
  const [showLocationMapping, setShowLocationMapping] = useState(false);

  const handleToggleSelect = (placeId: string) => {
    const newSelected = new Set(selectedPlaceIds);
    if (newSelected.has(placeId)) {
      newSelected.delete(placeId);
    } else {
      newSelected.add(placeId);
    }
    setSelectedPlaceIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPlaceIds.size === places.length) {
      setSelectedPlaceIds(new Set());
    } else {
      setSelectedPlaceIds(new Set(places.map((p) => p.id)));
    }
  };

  const handleQuickSave = () => {
    const selectedPlaces = places.filter((p) => selectedPlaceIds.has(p.id));
    onSaveSelected(selectedPlaces);
  };

  const handleSaveWithMapping = () => {
    const selectedPlaces = places.filter((p) => selectedPlaceIds.has(p.id));
    if (selectedPlaces.length === 0) return;
    setShowLocationMapping(true);
  };

  const handleSaveWithMappings = (mappings: LocationMapping[]) => {
    const selectedPlaces = places.filter((p) => selectedPlaceIds.has(p.id));
    onSaveSelected(selectedPlaces, mappings);
    setShowLocationMapping(false);
    setSelectedPlaceIds(new Set()); // Clear selection after save
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (places.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Search Results ({totalLoaded} places loaded)
              {hasMore && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - More available
                </span>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={saving}
              >
                <Check className="h-4 w-4 mr-1" />
                {selectedPlaceIds.size === places.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>

              {selectedPlaceIds.size > 0 && (
                <>
                  <Button
                    onClick={handleQuickSave}
                    disabled={saving}
                    variant="outline"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Quick Save ({selectedPlaceIds.size})
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleSaveWithMapping}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Save with Location Mapping ({selectedPlaceIds.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Select the places you want to import into your database. Use
            &quot;Quick Save&quot; for basic import or &quot;Save with Location
            Mapping&quot; to properly map locations to your existing database.
          </div>

          {selectedPlaceIds.size > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>{selectedPlaceIds.size}</strong> place
                {selectedPlaceIds.size !== 1 ? 's' : ''} selected for import
              </p>
            </div>
          )}

          {hasMore && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  More results available from OpenStreetMap
                </p>
                <Button
                  onClick={onLoadMore}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MoreHorizontal className="h-4 w-4 mr-1" />
                      Load More Places
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            selected={selectedPlaceIds.has(place.id)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>

      <LocationMappingModal
        open={showLocationMapping}
        onClose={() => setShowLocationMapping(false)}
        places={places.filter((p) => selectedPlaceIds.has(p.id))}
        onSaveWithMappings={handleSaveWithMappings}
        saving={saving}
      />
    </div>
  );
}
