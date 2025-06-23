'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Grid3X3,
  List,
  Map,
  MapPin,
  Mic,
  Search,
  MessageCircle,
  LayoutGrid,
  Bot,
} from 'lucide-react';
import React from 'react';
import { SearchLoadingSpinner } from './components/search-loading-spinner';
import { SearchSorting } from './components/search-sorting';
import { useSearch } from './hooks/use-search';
import { useSearchContext } from './hooks/use-search-context';
import { SearchMode } from './types';
import { CardView } from './views/card-view';
import { ListView } from './views/list-view';
import { UnifiedMapView } from './views/unified-map-view';
import { ChatView } from './views/chat';

export function SearchDrawer() {
  const {
    query,
    isSearching,
    results,
    viewMode,
    searchMode,
    hoveredPlaceId,
    selectedPlaceId,
    hasMore,
    sortConfig,
    setSortConfig,
    sortingCapabilities,
    search,
    loadMore,
    setViewMode,
    setSearchMode,
    setHoveredPlaceId,
    setSelectedPlaceId,
  } = useSearch();

  const {
    searchTerm,
    chatSearchTerm,
    userLocation,
    isOpenSearchWindow,
    setSearchTerm,
    setChatSearchTerm,
    onSearch,
    setIsOpenSearchWindow,
  } = useSearchContext();

  // Helper to determine current search mode for TypeScript
  const isChatMode = searchMode === 'chat';
  const currentTerm = isChatMode ? chatSearchTerm : searchTerm;
  const setCurrentTerm = isChatMode ? setChatSearchTerm : setSearchTerm;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentSearchTerm =
      (searchMode as string) === 'chat' ? chatSearchTerm : searchTerm;
    if (currentSearchTerm.trim() && currentSearchTerm !== query) {
      onSearch(currentSearchTerm);
      await search(currentSearchTerm, userLocation);
    }
  };

  const handleClose = () => {
    setIsOpenSearchWindow(false);
  };

  const renderViewToggle = () => (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Button
        variant={viewMode === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('map')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
      >
        <Map className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
        <span className="hidden sm:inline">Map</span>
      </Button>
      <Button
        variant={viewMode === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('card')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
      >
        <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
      >
        <List className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
        <span className="hidden sm:inline">List</span>
      </Button>
    </div>
  );

  const renderModeToggle = () => (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Button
        variant={searchMode === 'general' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setSearchMode('general')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
      >
        <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
        <span className="hidden sm:inline">General</span>
      </Button>
      <Button
        variant={searchMode === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setSearchMode('chat')}
        className="px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-xs sm:text-sm"
      >
        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
        <span className="hidden sm:inline">Chat</span>
      </Button>
    </div>
  );

  const renderGeneralContent = () => {
    if (isSearching && results.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <SearchLoadingSpinner />
        </div>
      );
    }

    if (!query && results.length === 0) {
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

    switch (viewMode) {
      case 'map':
        return (
          <UnifiedMapView
            places={results}
            hoveredPlaceId={hoveredPlaceId}
            selectedPlaceId={selectedPlaceId}
            onPlaceHover={setHoveredPlaceId}
            onPlaceSelect={setSelectedPlaceId}
            isLoading={isSearching}
          />
        );
      case 'card':
        return (
          <CardView
            places={results}
            hoveredPlaceId={hoveredPlaceId}
            onPlaceHover={setHoveredPlaceId}
            onPlaceSelect={setSelectedPlaceId}
            onLoadMore={() => loadMore(userLocation)}
            hasMore={hasMore}
            isLoading={isSearching}
          />
        );
      case 'list':
        return (
          <ListView
            places={results}
            hoveredPlaceId={hoveredPlaceId}
            onPlaceHover={setHoveredPlaceId}
            onPlaceSelect={setSelectedPlaceId}
            onLoadMore={() => loadMore(userLocation)}
            hasMore={hasMore}
            isLoading={isSearching}
          />
        );
      default:
        return null;
    }
  };

  const renderChatContent = () => {
    return (
      <ChatView
        places={results}
        hoveredPlaceId={hoveredPlaceId}
        selectedPlaceId={selectedPlaceId}
        onPlaceHover={setHoveredPlaceId}
        onPlaceSelect={setSelectedPlaceId}
        isLoading={isSearching}
        initialQuery={searchTerm}
      />
    );
  };

  return (
    <AnimatePresence>
      {isOpenSearchWindow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Chat Mode - Full Screen Chat */}
          {searchMode === 'chat' && (
            <>
              {/* Minimal Chat Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="border-b bg-background/95 backdrop-blur-xl flex-shrink-0"
              >
                <div className="container mx-auto px-4 py-3">
                  <div className="flex items-center justify-between">
                    {/* Back/Close Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="flex-shrink-0 px-2 sm:px-3"
                    >
                      <ArrowLeft className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>

                    {/* Chat Title */}
                    <div className="flex flex-1 justify-center items-center text-center">
                      <Bot className="h-6 w-6 sm:mr-2 text-gradient-to-r from-primary to-primary/50" />
                      <h2 className="text-lg font-semibold">AI Chat Search</h2>
                    </div>

                    {/* Mode Toggle */}
                    {renderModeToggle()}
                  </div>
                </div>
              </motion.div>

              {/* Chat Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex-1 min-h-0 overflow-hidden"
              >
                {renderChatContent()}
              </motion.div>
            </>
          )}

          {/* General Mode - Traditional Search Interface */}
          {searchMode === 'general' && (
            <>
              {/* Full Header with Search and Controls */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="border-b bg-background/95 backdrop-blur-xl flex-shrink-0"
              >
                <div className="container mx-auto px-4 py-3">
                  <div className="flex items-center gap-4">
                    {/* Back/Close Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="flex-shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="text"
                          placeholder="Search for places in Ghana..."
                          className="pr-12"
                          value={currentTerm}
                          onChange={(e) => setCurrentTerm(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="submit"
                        className="px-6"
                        disabled={!currentTerm.trim()}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </form>

                    {/* Mode Toggle */}
                    {renderModeToggle()}
                  </div>

                  {/* View Toggle and Sorting */}
                  <div className="flex items-center justify-between mt-4">
                    {renderViewToggle()}
                    <SearchSorting
                      sortConfig={sortConfig}
                      onSortChange={setSortConfig}
                      capabilities={sortingCapabilities}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Content Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex-1 min-h-0 overflow-hidden"
              >
                {renderGeneralContent()}
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
