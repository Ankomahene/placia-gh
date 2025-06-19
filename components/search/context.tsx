import { useLocation } from '@/hooks/use-location';
import { createContext, useState, useCallback, useMemo } from 'react';
import { ViewMode, SearchMode, SortConfig, SortingCapabilities } from './types';
import { PlaceResultsSummary } from '@/types/place';
import {
  applySorting,
  analyzeSortingCapabilities,
  convertServiceSortToConfig,
  getDefaultSortConfigForSearchType,
} from './utils/sorting-utils';

// Types for complete search results
interface GoogleSearchResult {
  results: PlaceResultsSummary[];
  success: boolean;
  query: string;
  nextPageToken?: string | null;
  search_type?: string;
  sort_order?: string;
}

interface SmartSearchResult {
  results: PlaceResultsSummary[];
  count: number;
  success: boolean;
  query: string;
  executionTime: number;
  search_type?: string;
  sort_order?: string;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface ISearchContext {
  // Input state
  searchTerm: string;
  previousSearchTerm: string;
  setSearchTerm: (query: string) => void;
  setPreviousSearchTerm: (query: string) => void;
  onSearch: (query: string) => void;
  isOpenSearchWindow: boolean;
  setIsOpenSearchWindow: (isOpen: boolean) => void;
  userLocation: { lat: number; lng: number };

  // View state
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  searchMode: SearchMode;
  setSearchMode: (searchMode: SearchMode) => void;
  hoveredPlaceId: string | null;
  setHoveredPlaceId: (placeId: string | null) => void;
  selectedPlaceId: string | null;
  setSelectedPlaceId: (placeId: string | null) => void;

  // Search state
  currentQuery: string;
  isSearching: boolean;
  searchResults: PlaceResultsSummary[];
  hasMore: boolean;

  // Complete search result objects
  googleSearchResult: GoogleSearchResult | null;
  smartSearchResult: SmartSearchResult | null;

  // Sorting state
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  sortingCapabilities: SortingCapabilities;
  sortedResults: PlaceResultsSummary[];

  // Search actions
  performSearch: (
    query: string,
    userLocation?: { lat: number; lng: number }
  ) => Promise<void>;
  loadMore: (userLocation?: { lat: number; lng: number }) => Promise<void>;
  clearResults: () => void;
}

export const SearchContext = createContext<ISearchContext | null>(null);

export const SearchContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previousSearchTerm, setPreviousSearchTerm] = useState('');
  const [isOpenSearchWindow, setIsOpenSearchWindow] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchMode, setSearchMode] = useState<SearchMode>('general');
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Search state
  const [currentQuery, setCurrentQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceResultsSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [pagination, setPagination] = useState({
    nextGooglePageToken: undefined as string | undefined | null,
    nextSmartSearchOffset: undefined as number | undefined | null,
  });

  // Complete search result objects
  const [googleSearchResult, setGoogleSearchResult] =
    useState<GoogleSearchResult | null>(null);
  const [smartSearchResult, setSmartSearchResult] =
    useState<SmartSearchResult | null>(null);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    type: 'none',
    order: 'nearest_first',
  });

  // Analyze sorting capabilities based on current search results
  const sortingCapabilities = useMemo(() => {
    return analyzeSortingCapabilities(searchResults);
  }, [searchResults]);

  // Apply sorting to search results
  const sortedResults = useMemo(() => {
    if (sortConfig.type === 'none') {
      return searchResults;
    }
    return applySorting(searchResults, sortConfig);
  }, [searchResults, sortConfig]);

  // Function to set default sort based on search results
  const setDefaultSortFromSearchResults = useCallback(
    (
      googleResult: GoogleSearchResult | null,
      smartResult: SmartSearchResult | null
    ) => {
      // Try to get sort config from service responses first
      const googleSortConfig = convertServiceSortToConfig(
        googleResult?.search_type,
        googleResult?.sort_order
      );
      const smartSortConfig = convertServiceSortToConfig(
        smartResult?.search_type,
        smartResult?.sort_order
      );

      // Use Google result sort config if available, otherwise Smart result, otherwise reset
      if (googleSortConfig) {
        setSortConfig(googleSortConfig);
      } else if (smartSortConfig) {
        setSortConfig(smartSortConfig);
      } else {
        // Fallback to default sort config based on search type
        const searchType =
          googleResult?.search_type || smartResult?.search_type;
        const defaultConfig = getDefaultSortConfigForSearchType(searchType);
        setSortConfig(defaultConfig);
      }
    },
    []
  );

  const location = useLocation();
  const userLocation = useMemo(
    () => ({
      lat: location.latitude as number,
      lng: location.longitude as number,
    }),
    [location.latitude, location.longitude]
  );

  const onSearch = useCallback(
    (query: string) => {
      if (!isOpenSearchWindow) {
        setIsOpenSearchWindow(true);
      }
      setPreviousSearchTerm(query);
    },
    [isOpenSearchWindow]
  );

  const performSearch = useCallback(
    async (query: string, userLocation?: { lat: number; lng: number }) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      setIsSearching(true);
      setCurrentQuery(trimmedQuery);
      setSearchResults([]);
      setHasMore(false);
      setGoogleSearchResult(null);
      setSmartSearchResult(null);
      setPagination({
        nextGooglePageToken: undefined,
        nextSmartSearchOffset: undefined,
      });

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmedQuery, userLocation }),
        });
        const data = await response.json();

        if (data.success) {
          const results = data.data.places;
          const newHasMore =
            !!data.data.nextGooglePageToken ||
            !!data.data.nextSmartSearchOffset;

          setSearchResults(results);
          setHasMore(newHasMore);
          setGoogleSearchResult(data.data.googleSearchResult || null);
          setSmartSearchResult(data.data.smartSearchResult || null);
          setPagination({
            nextGooglePageToken: data.data.nextGooglePageToken,
            nextSmartSearchOffset: data.data.nextSmartSearchOffset,
          });

          // Set default sort configuration based on search results
          setDefaultSortFromSearchResults(
            data.data.googleSearchResult || null,
            data.data.smartSearchResult || null
          );
        } else {
          throw new Error(data.error || 'Search failed');
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setHasMore(false);
      } finally {
        setIsSearching(false);
      }
    },
    [setDefaultSortFromSearchResults]
  );

  const loadMore = useCallback(
    async (userLocation?: { lat: number; lng: number }) => {
      if (isSearching || !hasMore || !currentQuery) return;

      setIsSearching(true);

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: currentQuery,
            userLocation,
            googlePageToken: pagination.nextGooglePageToken,
            smartSearchOffset: pagination.nextSmartSearchOffset,
          }),
        });
        const data = await response.json();

        if (data.success) {
          const newResults = [...searchResults, ...data.data.places];
          const newHasMore =
            !!data.data.nextGooglePageToken ||
            !!data.data.nextSmartSearchOffset;

          setSearchResults(newResults);
          setHasMore(newHasMore);

          // Update search result objects (merge with existing for load more)
          if (data.data.googleSearchResult) {
            setGoogleSearchResult((prev) =>
              prev
                ? {
                    ...data.data.googleSearchResult,
                    results: [
                      ...(prev.results || []),
                      ...data.data.googleSearchResult.results,
                    ],
                  }
                : data.data.googleSearchResult
            );
          }

          if (data.data.smartSearchResult) {
            setSmartSearchResult((prev) =>
              prev
                ? {
                    ...data.data.smartSearchResult,
                    results: [
                      ...(prev.results || []),
                      ...data.data.smartSearchResult.results,
                    ],
                  }
                : data.data.smartSearchResult
            );
          }

          setPagination({
            nextGooglePageToken: data.data.nextGooglePageToken,
            nextSmartSearchOffset: data.data.nextSmartSearchOffset,
          });
        } else {
          throw new Error(data.error || 'Load more failed');
        }
      } catch (error) {
        console.error('Load more error:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [isSearching, currentQuery, hasMore, searchResults, pagination]
  );

  const clearResults = useCallback(() => {
    setCurrentQuery('');
    setSearchResults([]);
    setHasMore(false);
    setIsSearching(false);
    setGoogleSearchResult(null);
    setSmartSearchResult(null);
    setSortConfig({ type: 'none', order: 'nearest_first' });
    setPagination({
      nextGooglePageToken: undefined,
      nextSmartSearchOffset: undefined,
    });
  }, []);

  return (
    <SearchContext.Provider
      value={{
        // Input state
        searchTerm,
        previousSearchTerm,
        isOpenSearchWindow,
        userLocation,
        setSearchTerm,
        setPreviousSearchTerm,
        onSearch,
        setIsOpenSearchWindow,

        // View state
        viewMode,
        searchMode,
        hoveredPlaceId,
        selectedPlaceId,
        setViewMode,
        setSearchMode,
        setHoveredPlaceId,
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
        clearResults,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
