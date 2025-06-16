'use client';

import { PlaceResults } from '@/types/place';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { generateMockPlaces, mockPlaces } from '../mock-data';
import { SearchFilters, SearchResult, SearchState, ViewMode } from '../types';
import {
  googlePlacesToSearchResults,
  placesToSearchResults,
} from '../utils/search-utils';

const RESULTS_PER_PAGE = 50;

export function useSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchState, setSearchState] = useState<SearchState>({
    query: searchParams.get('q') || '',
    isSearching: false,
    results: [],
    totalResults: 0,
    currentPage: 1,
    hasMore: false,
    viewMode: (searchParams.get('view') as ViewMode) || 'map',
    filters: {
      categories: [],
      subcategories: [],
      features: [],
      sources: ['local', 'google'], // Default to both sources
    },
    hoveredPlaceId: null,
    selectedPlaceId: null,
  });

  // Fetch Google search results
  const fetchGoogleResults = useCallback(
    async (
      query: string,
      userLocation?: { lat: number; lng: number }
    ): Promise<PlaceResults[]> => {
      try {
        const response = await fetch('/api/search/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, userLocation }),
        });

        const result = await response.json();
        if (result.success) {
          return result.data.places || [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching Google results:', error);
        return [];
      }
    },
    []
  );

  // Combined search function (local + Google)
  const performSearch = useCallback(
    async (
      query: string,
      filters: SearchFilters,
      page: number = 1,
      userLocation?: { lat: number; lng: number }
    ): Promise<{
      results: SearchResult[];
      totalResults: number;
      hasMore: boolean;
    }> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      let allResults: SearchResult[] = [];

      // Fetch local results if enabled
      if (!filters.sources || filters.sources.includes('local')) {
        let localPlaces = [...mockPlaces];

        // Add generated results for pagination testing
        if (query) {
          localPlaces = [...localPlaces, ...generateMockPlaces(20)];
        }

        // Filter local places by query
        if (query) {
          localPlaces = localPlaces.filter(
            (place) =>
              place.name.toLowerCase().includes(query.toLowerCase()) ||
              place.description?.toLowerCase().includes(query.toLowerCase()) ||
              place.tags?.some((tag) =>
                tag.toLowerCase().includes(query.toLowerCase())
              )
          );
        }

        // Filter by categories
        if (filters.categories.length > 0) {
          localPlaces = localPlaces.filter((place) =>
            filters.categories.includes(place.category_id)
          );
        }

        // Filter by subcategories
        if (filters.subcategories.length > 0) {
          localPlaces = localPlaces.filter((place) =>
            filters.subcategories.includes(place.subcategory_id)
          );
        }

        // Filter by rating
        if (filters.rating) {
          localPlaces = localPlaces.filter(
            (place) => place.rating && place.rating.rate >= filters.rating!
          );
        }

        // Filter by features
        if (filters.features && filters.features.length > 0) {
          localPlaces = localPlaces.filter((place) =>
            filters.features!.some(
              (feature) =>
                place.features?.some((pf) =>
                  pf.label.toLowerCase().includes(feature.toLowerCase())
                ) ||
                place.services?.some((ps) =>
                  ps.label.toLowerCase().includes(feature.toLowerCase())
                )
            )
          );
        }

        // Convert to SearchResult format
        allResults = [...allResults, ...placesToSearchResults(localPlaces)];
      }

      // Fetch Google results if enabled and we have a query
      if (query && (!filters.sources || filters.sources.includes('google'))) {
        try {
          const googlePlaces = await fetchGoogleResults(query, userLocation);
          const googleResults = googlePlacesToSearchResults(googlePlaces);

          // Apply rating filter to Google results if specified
          const filteredGoogleResults = filters.rating
            ? googleResults.filter(
                (result) =>
                  result.rating && result.rating.rate >= filters.rating!
              )
            : googleResults;

          allResults = [...filteredGoogleResults, ...allResults];
        } catch (error) {
          console.error('Error fetching Google results in search:', error);
        }
      }

      const totalResults = allResults.length;
      const startIndex = (page - 1) * RESULTS_PER_PAGE;
      const endIndex = startIndex + RESULTS_PER_PAGE;
      const results = allResults.slice(startIndex, endIndex);
      const hasMore = endIndex < totalResults;

      return { results, totalResults, hasMore };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const search = useCallback(
    async (
      query: string,
      updateUrl: boolean = true,
      userLocation?: { lat: number; lng: number }
    ) => {
      setSearchState((prev) => ({ ...prev, isSearching: true, query }));

      if (updateUrl) {
        const params = new URLSearchParams(searchParams);
        if (query) {
          params.set('q', query);
        } else {
          params.delete('q');
        }
        router.push(`/?${params.toString()}`);
      }

      try {
        const { results, totalResults, hasMore } = await performSearch(
          query,
          searchState.filters,
          1,
          userLocation
        );

        setSearchState((prev) => ({
          ...prev,
          isSearching: false,
          results,
          totalResults,
          currentPage: 1,
          hasMore,
        }));
      } catch (error) {
        console.error('Search error:', error);
        setSearchState((prev) => ({
          ...prev,
          isSearching: false,
          results: [],
          totalResults: 0,
          hasMore: false,
        }));
      }
    },
    [searchParams, router, performSearch, searchState.filters]
  );

  const loadMore = useCallback(async () => {
    if (searchState.isSearching || !searchState.hasMore) return;

    setSearchState((prev) => ({ ...prev, isSearching: true }));

    try {
      const nextPage = searchState.currentPage + 1;
      const { results: newResults, hasMore } = await performSearch(
        searchState.query,
        searchState.filters,
        nextPage
      );

      setSearchState((prev) => ({
        ...prev,
        isSearching: false,
        results: [...prev.results, ...newResults],
        currentPage: nextPage,
        hasMore,
      }));
    } catch (error) {
      console.error('Load more error:', error);
      setSearchState((prev) => ({ ...prev, isSearching: false }));
    }
  }, [searchState, performSearch]);

  const setViewMode = useCallback(
    (viewMode: ViewMode) => {
      setSearchState((prev) => ({ ...prev, viewMode }));

      const params = new URLSearchParams(searchParams);
      params.set('view', viewMode);
      router.push(`/?${params.toString()}`);
    },
    [searchParams, router]
  );

  const setFilters = useCallback(
    (filters: SearchFilters) => {
      setSearchState((prev) => ({ ...prev, filters }));
      // Re-search with new filters
      search(searchState.query, false);
    },
    [searchState.query, search]
  );

  const setHoveredPlace = useCallback((placeId: string | null) => {
    setSearchState((prev) => ({ ...prev, hoveredPlaceId: placeId }));
  }, []);

  const setSelectedPlace = useCallback((placeId: string | null) => {
    setSearchState((prev) => ({ ...prev, selectedPlaceId: placeId }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      query: '',
      results: [],
      totalResults: 0,
      currentPage: 1,
      hasMore: false,
      hoveredPlaceId: null,
      selectedPlaceId: null,
    }));

    const params = new URLSearchParams(searchParams);
    params.delete('q');
    params.delete('view');
    router.push('/');
  }, [searchParams, router]);

  // Initialize search from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && query !== searchState.query) {
      search(query, false);
    }
  }, [searchParams, search, searchState.query]);

  return {
    searchState,
    search,
    loadMore,
    setViewMode,
    setFilters,
    setHoveredPlace,
    setSelectedPlace,
    clearSearch,
  };
}
