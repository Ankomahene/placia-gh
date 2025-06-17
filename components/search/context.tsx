import { useLocation } from '@/hooks/use-location';
import { createContext, useState, useCallback, useMemo } from 'react';
import { ViewMode } from './types';
import { PlaceResultsSummary } from '@/types/place';

interface ISearchContext {
  // Input state
  searchTerm: string;
  setSearchTerm: (query: string) => void;
  onSearch: (query: string) => void;
  isOpenSearchWindow: boolean;
  setIsOpenSearchWindow: (isOpen: boolean) => void;
  userLocation: { lat: number; lng: number };

  // View state
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  hoveredPlaceId: string | null;
  setHoveredPlaceId: (placeId: string | null) => void;
  selectedPlaceId: string | null;
  setSelectedPlaceId: (placeId: string | null) => void;

  // Search state
  currentQuery: string;
  isSearching: boolean;
  searchResults: PlaceResultsSummary[];
  hasMore: boolean;

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
  const [isOpenSearchWindow, setIsOpenSearchWindow] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
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
          setPagination({
            nextGooglePageToken: data.data.nextGooglePageToken,
            nextSmartSearchOffset: data.data.nextSmartSearchOffset,
          });
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
    []
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
        isOpenSearchWindow,
        userLocation,
        setSearchTerm,
        onSearch,
        setIsOpenSearchWindow,

        // View state
        viewMode,
        hoveredPlaceId,
        selectedPlaceId,
        setViewMode,
        setHoveredPlaceId,
        setSelectedPlaceId,

        // Search state
        currentQuery,
        isSearching,
        searchResults,
        hasMore,

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
