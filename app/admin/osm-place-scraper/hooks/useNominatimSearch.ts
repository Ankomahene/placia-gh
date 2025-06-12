'use client';

import { useState, useCallback } from 'react';
import { NominatimPlace, MappedPlace } from '../types';

interface UseNominatimSearchResult {
  places: MappedPlace[];
  loading: boolean;
  error: string | null;
  searchPlaces: (query: string, location?: string) => Promise<void>;
  loadMorePlaces: () => Promise<void>;
  clearResults: () => void;
  hasMore: boolean;
  totalLoaded: number;
}

export function useNominatimSearch(): UseNominatimSearchResult {
  const [places, setPlaces] = useState<MappedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [loadMoreAttempts, setLoadMoreAttempts] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const performSearch = async (
    query: string,
    location: string,
    searchVariation: number = 0,
    append: boolean = false
  ) => {
    // Different search strategies for "load more"
    let searchQuery = location ? `${query} in ${location}` : query;
    let limit = '20';

    if (searchVariation > 0) {
      // For load more, try different search variations
      switch (searchVariation) {
        case 1:
          // Search with broader terms
          searchQuery = location
            ? `${query} near ${location}`
            : `${query} amenity`;
          limit = '30';
          break;
        case 2:
          // Search with different location terms
          searchQuery = location
            ? `${query} ${location} area`
            : `${query} facility`;
          limit = '25';
          break;
        case 3:
          // Search with just the query without location constraints
          searchQuery = query;
          limit = '40';
          break;
        default:
          // Increase limit for subsequent attempts
          limit = '50';
          break;
      }
    }

    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      addressdetails: '1',
      extratags: '1',
      namedetails: '1',
      limit,
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'Placia-App/1.0 (admin@placia.com)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NominatimPlace[] = await response.json();

    const mappedPlaces: MappedPlace[] = data.map((place) => ({
      id: `osm-${place.osm_type}-${place.osm_id}`,
      name: extractPlaceName(place),
      description: generateDescription(place),
      location: {
        lng: parseFloat(place.lon),
        lat: parseFloat(place.lat),
        name: place.display_name,
        street_address: extractStreetAddress(place),
      },
      source: 'osm' as const,
      source_link: `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}`,
      raw_data: place,
    }));

    // Filter out duplicates when appending
    if (append) {
      const existingIds = new Set(places.map((p) => p.id));
      const newPlaces = mappedPlaces.filter((p) => !existingIds.has(p.id));

      if (newPlaces.length > 0) {
        setPlaces((prev) => [...prev, ...newPlaces]);
      }

      // Check if we should continue trying to load more
      setHasMore(newPlaces.length > 0 && searchVariation < 4);
      return newPlaces.length;
    } else {
      setPlaces(mappedPlaces);
      setHasMore(data.length >= 15); // Conservative threshold
      return mappedPlaces.length;
    }
  };

  const searchPlaces = useCallback(async (query: string, location?: string) => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentQuery(query);
    setCurrentLocation(location || '');
    setLoadMoreAttempts(0);
    setHasMore(true);

    try {
      await performSearch(query, location || '', 0, false);
    } catch (err) {
      console.error('Nominatim search error:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred while searching'
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMorePlaces = useCallback(async () => {
    if (!currentQuery || loading || !hasMore) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newAttempt = loadMoreAttempts + 1;
      const addedCount = await performSearch(
        currentQuery,
        currentLocation,
        newAttempt,
        true
      );

      setLoadMoreAttempts(newAttempt);

      // If no new places were found after 4 attempts, stop trying
      if (addedCount === 0 || newAttempt >= 4) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Load more error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while loading more places'
      );
      setHasMore(false); // Stop trying on error
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentQuery,
    currentLocation,
    loadMoreAttempts,
    loading,
    hasMore,
    places,
  ]);

  const clearResults = useCallback(() => {
    setPlaces([]);
    setError(null);
    setCurrentQuery('');
    setCurrentLocation('');
    setLoadMoreAttempts(0);
    setHasMore(true);
  }, []);

  return {
    places,
    loading,
    error,
    searchPlaces,
    loadMorePlaces,
    clearResults,
    hasMore,
    totalLoaded: places.length,
  };
}

function extractPlaceName(place: NominatimPlace): string {
  // Try to get the most appropriate name
  if (place.namedetails?.name) {
    return place.namedetails.name;
  }

  // Extract name from display_name
  const parts = place.display_name.split(',');
  return parts[0].trim();
}

function generateDescription(place: NominatimPlace): string {
  const type = place.type.replace(/_/g, ' ');
  const category = place.class.replace(/_/g, ' ');

  let description = `${type} (${category})`;

  if (place.address?.city || place.address?.town || place.address?.village) {
    const locality =
      place.address.city || place.address.town || place.address.village;
    description += ` in ${locality}`;
  }

  return description;
}

function extractStreetAddress(place: NominatimPlace): string {
  const address = place.address;
  if (!address) return '';

  const parts = [];

  if (address.house_number) parts.push(address.house_number);
  if (address.road) parts.push(address.road);
  if (address.neighbourhood) parts.push(address.neighbourhood);

  return parts.join(' ');
}
