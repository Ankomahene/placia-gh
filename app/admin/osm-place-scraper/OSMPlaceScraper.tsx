'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { PlaceSearchForm } from './components/PlaceSearchForm';
import { PlaceResults } from './components/PlaceResults';
import { useNominatimSearch } from './hooks/useNominatimSearch';
import { useSupabaseSave } from './hooks/useSupabaseSave';
import { MappedPlace } from './types';

export function OSMPlaceScraper() {
  const {
    places,
    loading,
    error: searchError,
    searchPlaces,
    loadMorePlaces,
    clearResults,
    hasMore,
    totalLoaded,
  } = useNominatimSearch();

  const { saving, saveError, savedCount, savePlaces, clearSaveState } =
    useSupabaseSave();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async (query: string, location?: string) => {
    clearSaveState();
    setSuccessMessage(null);
    await searchPlaces(query, location);
  };

  const handleClear = () => {
    clearResults();
    clearSaveState();
    setSuccessMessage(null);
  };

  const handleSaveSelected = async (
    selectedPlaces: MappedPlace[],
    mappings?: any[]
  ) => {
    // If mappings are provided, use them to save with proper location data
    const success = await savePlaces(selectedPlaces, mappings);
    if (success) {
      setSuccessMessage(
        `Successfully saved place${savedCount !== 1 ? 's' : ''} to the database!`
      );
      // Optionally clear results after successful save
      // clearResults();
    }
  };

  return (
    <div className="space-y-6">
      <PlaceSearchForm
        onSearch={handleSearch}
        loading={loading}
        onClear={handleClear}
      />

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <PlaceResults
        places={places}
        error={searchError}
        onSaveSelected={handleSaveSelected}
        onLoadMore={loadMorePlaces}
        saving={saving}
        hasMore={hasMore}
        totalLoaded={totalLoaded}
        loading={loading}
      />
    </div>
  );
}
