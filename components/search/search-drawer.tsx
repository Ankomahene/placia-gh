'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  MapPin,
  Grid3X3,
  List,
  Map,
  Mic,
} from 'lucide-react';
import { useSearch } from './hooks/use-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchFilters } from './filters/search-filters';
import { MapView } from './views/map-view';
import { CardView } from './views/card-view';
import { ListView } from './views/list-view';
import { SearchLoadingSpinner } from './components/search-loading-spinner';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  searchInput?: string;
  onSearchInputChange?: (input: string) => void;
}

export function SearchDrawer({
  isOpen,
  onClose,
  initialQuery = '',
  searchInput: externalSearchInput = '',
  onSearchInputChange,
}: SearchDrawerProps) {
  const {
    searchState,
    search,
    loadMore,
    setViewMode,
    setFilters,
    setHoveredPlace,
    setSelectedPlace,
    clearSearch,
  } = useSearch();

  const [searchInput, setSearchInput] = React.useState(
    externalSearchInput || initialQuery
  );
  const [hasUserSearched, setHasUserSearched] = React.useState(false);

  // Sync with external search input (from hero section)
  useEffect(() => {
    if (externalSearchInput !== undefined && !hasUserSearched) {
      setSearchInput(externalSearchInput);
    }
  }, [externalSearchInput, hasUserSearched]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle initial query only on first open
  useEffect(() => {
    if (
      isOpen &&
      initialQuery &&
      initialQuery !== searchState.query &&
      !hasUserSearched
    ) {
      setSearchInput(initialQuery);
      search(initialQuery);
      setHasUserSearched(true);
    }
  }, [isOpen, initialQuery, search, searchState.query, hasUserSearched]);

  // Reset user search flag when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setHasUserSearched(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    onSearchInputChange?.(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setHasUserSearched(true);
      search(searchInput.trim());
    }
  };

  const handleClose = () => {
    clearSearch();
    setHasUserSearched(false);
    onClose();
  };

  const renderViewToggle = () => (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Button
        variant={searchState.viewMode === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('map')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
      >
        <Map className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
        <span className="hidden sm:inline">Map</span>
      </Button>
      <Button
        variant={searchState.viewMode === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('card')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
      >
        <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant={searchState.viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
      >
        <List className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
        <span className="hidden sm:inline">List</span>
      </Button>
    </div>
  );

  const renderContent = () => {
    if (searchState.isSearching && searchState.results.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <SearchLoadingSpinner />
        </div>
      );
    }

    if (!searchState.query && searchState.results.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Search for Amazing Places
            </h3>
            <p className="text-muted-foreground">
              Enter a location, restaurant, hotel, or attraction to discover the
              best places in Ghana.
            </p>
          </div>
        </div>
      );
    }

    switch (searchState.viewMode) {
      case 'map':
        return (
          <MapView
            places={searchState.results}
            hoveredPlaceId={searchState.hoveredPlaceId}
            selectedPlaceId={searchState.selectedPlaceId}
            onPlaceHover={setHoveredPlace}
            onPlaceSelect={setSelectedPlace}
            isLoading={searchState.isSearching}
          />
        );
      case 'card':
        return (
          <CardView
            places={searchState.results}
            hoveredPlaceId={searchState.hoveredPlaceId}
            onPlaceHover={setHoveredPlace}
            onPlaceSelect={setSelectedPlace}
            onLoadMore={loadMore}
            hasMore={searchState.hasMore}
            isLoading={searchState.isSearching}
          />
        );
      case 'list':
        return (
          <ListView
            places={searchState.results}
            hoveredPlaceId={searchState.hoveredPlaceId}
            onPlaceHover={setHoveredPlace}
            onPlaceSelect={setSelectedPlace}
            onLoadMore={loadMore}
            hasMore={searchState.hasMore}
            isLoading={searchState.isSearching}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="border-b bg-background/95 backdrop-blur-xl flex-shrink-0"
          >
            <div className="container mx-auto px-4 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="flex-shrink-0 px-2 sm:px-3"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      value={searchInput}
                      onChange={handleInputChange}
                      placeholder="Search for places in Ghana..."
                      className="pl-10 pr-16 py-2 sm:py-3 text-sm sm:text-base"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                      >
                        <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="sr-only">Voice search</span>
                      </Button>
                    </div>
                  </div>
                </form>

                {/* View Toggle */}
                {searchState.results.length > 0 && renderViewToggle()}
              </div>

              {/* Results Summary */}
              {searchState.query && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 sm:mt-3 flex items-center gap-2"
                >
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {searchState.isSearching
                      ? 'Searching...'
                      : searchState.totalResults > 0
                        ? `Found ${searchState.totalResults} place${searchState.totalResults === 1 ? '' : 's'}`
                        : 'No places found'}
                  </span>
                  {searchState.query && (
                    <Badge variant="secondary" className="text-xs">
                      &quot;{searchState.query}&quot;
                    </Badge>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Filters */}
          {searchState.results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border-b bg-muted/20 flex-shrink-0"
            >
              <div className="container mx-auto px-4 py-2 sm:py-3">
                <SearchFilters
                  filters={searchState.filters}
                  onFiltersChange={setFilters}
                />
              </div>
            </motion.div>
          )}

          {/* Content - This is the scrollable area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex-1 min-h-0 overflow-hidden"
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
