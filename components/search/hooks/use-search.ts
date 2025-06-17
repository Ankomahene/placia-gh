'use client';

import { useSearchContext } from './use-search-context';

export function useSearch() {
  const {
    // View state
    viewMode,
    setViewMode,
    hoveredPlaceId,
    setHoveredPlaceId,
    selectedPlaceId,
    setSelectedPlaceId,

    // Search state
    currentQuery,
    isSearching,
    searchResults,
    hasMore,

    // Search actions
    performSearch,
    loadMore,
  } = useSearchContext();

  return {
    query: currentQuery,
    isSearching,
    results: searchResults,
    viewMode,
    hoveredPlaceId,
    selectedPlaceId,
    hasMore,
    search: performSearch,
    loadMore,
    setViewMode,
    setHoveredPlaceId,
    setSelectedPlaceId,
  };
}
