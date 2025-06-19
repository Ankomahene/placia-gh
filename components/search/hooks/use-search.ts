'use client';

import { useSearchContext } from './use-search-context';

export function useSearch() {
  const {
    // View state
    viewMode,
    setViewMode,
    searchMode,
    setSearchMode,
    hoveredPlaceId,
    setHoveredPlaceId,
    selectedPlaceId,
    setSelectedPlaceId,

    // Search state
    currentQuery,
    isSearching,
    searchResults,
    hasMore,

    // Complete search result objects
    googleSearchResult,
    smartSearchResult,

    // Sorting state
    sortConfig,
    setSortConfig,
    sortingCapabilities,
    sortedResults,

    // Search actions
    performSearch,
    loadMore,
  } = useSearchContext();

  return {
    query: currentQuery,
    isSearching,
    results: sortedResults, // Use sorted results instead of raw results
    rawResults: searchResults, // Expose raw results for debugging
    viewMode,
    searchMode,
    hoveredPlaceId,
    selectedPlaceId,
    hasMore,

    // Complete search result objects with all metadata
    googleSearchResult,
    smartSearchResult,

    // Sorting functionality
    sortConfig,
    setSortConfig,
    sortingCapabilities,

    search: performSearch,
    loadMore,
    setViewMode,
    setSearchMode,
    setHoveredPlaceId,
    setSelectedPlaceId,
  };
}
