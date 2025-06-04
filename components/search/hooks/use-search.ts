'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchState, SearchFilters, ViewMode } from '../types';
import { mockPlaces, generateMockPlaces } from '../mock-data';
import { Place } from '@/types/place';

const RESULTS_PER_PAGE = 12;

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
    },
    hoveredPlaceId: null,
    selectedPlaceId: null,
  });

  // Mock search function
  const performSearch = useCallback(
    async (
      query: string,
      filters: SearchFilters,
      page: number = 1
    ): Promise<{
      results: Place[];
      totalResults: number;
      hasMore: boolean;
    }> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      let allResults = [...mockPlaces];

      // Add generated results for pagination testing
      if (query) {
        allResults = [...allResults, ...generateMockPlaces(50)];
      }

      // Filter by query
      if (query) {
        allResults = allResults.filter(
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
        allResults = allResults.filter((place) =>
          filters.categories.includes(place.category_id)
        );
      }

      // Filter by subcategories
      if (filters.subcategories.length > 0) {
        allResults = allResults.filter((place) =>
          filters.subcategories.includes(place.subcategory_id)
        );
      }

      // Filter by rating
      if (filters.rating) {
        allResults = allResults.filter(
          (place) => place.rating && place.rating.rate >= filters.rating!
        );
      }

      // Filter by features
      if (filters.features && filters.features.length > 0) {
        allResults = allResults.filter((place) =>
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

      const totalResults = allResults.length;
      const startIndex = (page - 1) * RESULTS_PER_PAGE;
      const endIndex = startIndex + RESULTS_PER_PAGE;
      const results = allResults.slice(startIndex, endIndex);
      const hasMore = endIndex < totalResults;

      return { results, totalResults, hasMore };
    },
    []
  );

  const search = useCallback(
    async (query: string, updateUrl: boolean = true) => {
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
          1
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
  }, []);

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
