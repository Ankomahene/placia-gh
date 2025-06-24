import { useLocation } from '@/hooks/use-location';
import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
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
  // Input state - separated for general and chat
  searchTerm: string;
  chatSearchTerm: string;
  previousSearchTerm: string;
  setSearchTerm: (query: string) => void;
  setChatSearchTerm: (query: string) => void;
  setPreviousSearchTerm: (query: string) => void;
  onSearch: (query: string) => void;
  onChatSearch: (query: string) => void;
  isOpenSearchWindow: boolean;
  setIsOpenSearchWindow: (isOpen: boolean) => void;
  userLocation: { lat: number; lng: number };
  shouldAutoRunChat: boolean;
  setShouldAutoRunChat: (should: boolean) => void;

  // Search functionality
  query: string;
  isSearching: boolean;
  results: PlaceResultsSummary[];
  viewMode: ViewMode;
  searchMode: SearchMode;
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  hasMore: boolean;
  sortConfig: SortConfig;
  sortingCapabilities: SortingCapabilities;
  performSearch: (
    query: string,
    location: { lat: number; lng: number }
  ) => Promise<void>;
  search: (
    query: string,
    location: { lat: number; lng: number }
  ) => Promise<void>;
  loadMore: (location: { lat: number; lng: number }) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setSearchMode: (mode: SearchMode) => void;
  setHoveredPlaceId: (id: string | null) => void;
  setSelectedPlaceId: (id: string) => void;
  setSortConfig: (config: SortConfig) => void;

  // Cache management
  saveSearchState: () => void;
  restoreSearchState: () => boolean;
  clearSearchCache: () => void;
  setNavigationSource: (
    source: 'home' | 'general_search' | 'chat_search'
  ) => void;
  getNavigationSource: () => string | null;

  // Complete search result objects
  googleSearchResult: GoogleSearchResult | null;
  smartSearchResult: SmartSearchResult | null;

  // Search state
  currentQuery: string;
  searchResults: PlaceResultsSummary[];
  pagination: {
    nextGooglePageToken: string | undefined | null;
    nextSmartSearchOffset: number | undefined | null;
  };
}

export const SearchContext = createContext<ISearchContext | null>(null);

export const SearchContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [previousSearchTerm, setPreviousSearchTerm] = useState('');
  const [isOpenSearchWindow, setIsOpenSearchWindow] = useState(false);
  const [shouldAutoRunChat, setShouldAutoRunChat] = useState(false);
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

  const onChatSearch = useCallback(
    (query: string) => {
      if (!isOpenSearchWindow) {
        setIsOpenSearchWindow(true);
      }
      setChatSearchTerm(query);
      setPreviousSearchTerm(query);
      setShouldAutoRunChat(true);
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

  // Session storage keys
  const SEARCH_CACHE_KEY = 'placia_search_state';
  const NAVIGATION_SOURCE_KEY = 'placia_navigation_source';

  // Save search state to session storage
  const saveSearchState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const searchState = {
      // General search state
      searchTerm,
      // Chat search state
      chatSearchTerm,
      query: currentQuery,
      results: searchResults,
      viewMode,
      searchMode,
      sortConfig,
      hasMore,
      // Cache timestamp for expiration
      timestamp: Date.now(),
      // User location
      userLocation,
    };

    try {
      sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(searchState));
    } catch (error) {
      console.warn('Failed to save search state to session storage:', error);
    }
  }, [
    searchTerm,
    chatSearchTerm,
    currentQuery,
    searchResults,
    viewMode,
    searchMode,
    sortConfig,
    hasMore,
    userLocation,
  ]);

  // Restore search state from session storage
  const restoreSearchState = useCallback(() => {
    if (typeof window === 'undefined') return false;

    try {
      const cached = sessionStorage.getItem(SEARCH_CACHE_KEY);
      if (!cached) return false;

      const searchState = JSON.parse(cached);

      // Check if cache is not too old (24 hours)
      const cacheAge = Date.now() - (searchState.timestamp || 0);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge > maxAge) {
        sessionStorage.removeItem(SEARCH_CACHE_KEY);
        return false;
      }

      // Restore state
      if (searchState.searchTerm) setSearchTerm(searchState.searchTerm);
      if (searchState.chatSearchTerm)
        setChatSearchTerm(searchState.chatSearchTerm);
      if (searchState.query) setCurrentQuery(searchState.query);
      if (searchState.results) setSearchResults(searchState.results);
      if (searchState.viewMode) setViewMode(searchState.viewMode);
      if (searchState.searchMode) setSearchMode(searchState.searchMode);
      if (searchState.sortConfig) setSortConfig(searchState.sortConfig);
      if (searchState.hasMore !== undefined) setHasMore(searchState.hasMore);

      return true;
    } catch (error) {
      console.warn(
        'Failed to restore search state from session storage:',
        error
      );
      return false;
    }
  }, [
    setSearchTerm,
    setChatSearchTerm,
    setCurrentQuery,
    setSearchResults,
    setViewMode,
    setSearchMode,
    setSortConfig,
    setHasMore,
  ]);

  // Clear search cache
  const clearSearchCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SEARCH_CACHE_KEY);
  }, []);

  // Navigation source tracking
  const setNavigationSource = useCallback(
    (source: 'home' | 'general_search' | 'chat_search') => {
      if (typeof window === 'undefined') return;
      sessionStorage.setItem(NAVIGATION_SOURCE_KEY, source);
    },
    []
  );

  const getNavigationSource = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(NAVIGATION_SOURCE_KEY);
  }, []);

  // Auto-save search state when relevant data changes
  useEffect(() => {
    // Save state if we have search results OR if we're in chat mode with a search term
    const shouldSave =
      (searchResults.length > 0 && currentQuery) ||
      (searchMode === 'chat' && chatSearchTerm);

    if (shouldSave) {
      saveSearchState();
    }
  }, [
    searchResults,
    currentQuery,
    viewMode,
    searchMode,
    chatSearchTerm,
    sortConfig,
    saveSearchState,
  ]);

  const contextValue = useMemo(() => {
    return {
      // Input state - separated for general and chat
      searchTerm,
      chatSearchTerm,
      previousSearchTerm,
      isOpenSearchWindow,
      userLocation,
      setSearchTerm,
      setChatSearchTerm,
      setPreviousSearchTerm,
      onSearch,
      onChatSearch,
      setIsOpenSearchWindow,
      shouldAutoRunChat,
      setShouldAutoRunChat,

      // Search functionality
      query: currentQuery,
      isSearching,
      results: sortedResults,
      viewMode,
      searchMode,
      hoveredPlaceId,
      selectedPlaceId,
      hasMore,
      sortConfig,
      sortingCapabilities,
      performSearch,
      search: performSearch,
      loadMore,
      setViewMode,
      setSearchMode,
      setHoveredPlaceId,
      setSelectedPlaceId,
      setSortConfig,

      // Cache management
      saveSearchState,
      restoreSearchState,
      clearSearchCache,
      setNavigationSource,
      getNavigationSource,

      // Complete search result objects
      googleSearchResult,
      smartSearchResult,

      // Search state
      currentQuery,
      searchResults,
      pagination,
    };
  }, [
    searchTerm,
    chatSearchTerm,
    previousSearchTerm,
    isOpenSearchWindow,
    userLocation,
    setSearchTerm,
    setChatSearchTerm,
    setPreviousSearchTerm,
    onSearch,
    onChatSearch,
    setIsOpenSearchWindow,
    shouldAutoRunChat,
    setShouldAutoRunChat,
    currentQuery,
    isSearching,
    sortedResults,
    searchResults,
    viewMode,
    searchMode,
    hoveredPlaceId,
    selectedPlaceId,
    hasMore,
    sortConfig,
    sortingCapabilities,
    performSearch,
    loadMore,
    setViewMode,
    setSearchMode,
    setHoveredPlaceId,
    setSelectedPlaceId,
    setSortConfig,
    saveSearchState,
    restoreSearchState,
    clearSearchCache,
    setNavigationSource,
    getNavigationSource,
    googleSearchResult,
    smartSearchResult,
    pagination,
  ]);

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};
