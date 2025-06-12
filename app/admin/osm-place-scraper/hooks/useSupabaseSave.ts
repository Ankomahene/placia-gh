'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MappedPlace } from '../types';
import { mapToPlaceModel } from '../utils/placeMapper';

interface UseSupabaseSaveResult {
  saving: boolean;
  saveError: string | null;
  savedCount: number;
  savePlaces: (places: MappedPlace[], mappings?: any[]) => Promise<boolean>;
  clearSaveState: () => void;
}

export function useSupabaseSave(): UseSupabaseSaveResult {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const supabase = createClient();

  const savePlaces = async (
    places: MappedPlace[],
    mappings?: any[]
  ): Promise<boolean> => {
    if (places.length === 0) {
      setSaveError('No places selected for saving');
      return false;
    }

    setSaving(true);
    setSaveError(null);
    setSavedCount(0);

    try {
      // Convert mapped places to Place model format
      const placesToSave = places.map(mapToPlaceModel);

      // Apply location mappings if provided
      const processedPlaces = placesToSave.map((place, index) => {
        // Get the original OSM ID from the corresponding MappedPlace
        const originalOsmId = places[index]?.id;
        const mapping = mappings?.find((m) => m.place_id === originalOsmId);

        return {
          ...place,
          // Use mapped IDs if available, convert to string to match database schema
          country_id: mapping?.country_id
            ? String(mapping.country_id)
            : 'placeholder-country-id',
          region_id: mapping?.region_id
            ? String(mapping.region_id)
            : 'placeholder-region-id',
          city_id: mapping?.city_id
            ? String(mapping.city_id)
            : 'placeholder-city-id',
          category_id: mapping?.category_id || 'placeholder-category-id',
          subcategory_id:
            mapping?.subcategory_id || 'placeholder-subcategory-id',
        };
      });

      // Save to Supabase
      const { data, error } = await supabase
        .from('places')
        .insert(processedPlaces)
        .select();

      if (error) {
        console.error('Supabase save error:', error);
        setSaveError(error.message);
        return false;
      }

      setSavedCount(data?.length || 0);
      return true;
    } catch (error) {
      console.error('Save places error:', error);
      setSaveError(
        error instanceof Error
          ? error.message
          : 'An error occurred while saving'
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const clearSaveState = () => {
    setSaveError(null);
    setSavedCount(0);
  };

  return {
    saving,
    saveError,
    savedCount,
    savePlaces,
    clearSaveState,
  };
}

// Helper function to match locations to existing database entries
export async function matchLocations(address: any, supabase: any) {
  // This is a placeholder function - you'll need to implement proper matching logic
  // based on your existing countries, regions, cities, and towns data

  try {
    // Example: Match country by name
    if (address.country) {
      const { data: countries } = await supabase
        .from('countries')
        .select('id')
        .ilike('name', `%${address.country}%`)
        .limit(1);

      if (countries && countries.length > 0) {
        return { country_id: countries[0].id };
      }
    }

    return {
      country_id: null,
      region_id: null,
      city_id: null,
    };
  } catch (error) {
    console.error('Location matching error:', error);
    return {
      country_id: null,
      region_id: null,
      city_id: null,
    };
  }
}
