'use client';

import React, { useState, Suspense } from 'react';
import HeroSection from '@/components/hero-section';
import { SearchDrawer } from './search-drawer';

function SearchDrawerWithSuspense({
  isOpen,
  onClose,
  initialQuery,
  searchInput,
  onSearchInputChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  searchInput: string;
  onSearchInputChange: (input: string) => void;
}) {
  return (
    <Suspense fallback={<div></div>}>
      <SearchDrawer
        isOpen={isOpen}
        onClose={onClose}
        initialQuery={initialQuery}
        searchInput={searchInput}
        onSearchInputChange={onSearchInputChange}
      />
    </Suspense>
  );
}

export function SearchClientWrapper() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchInput(query);
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  const handleSearchInputChange = (input: string) => {
    setSearchInput(input);
  };

  return (
    <>
      <HeroSection
        onSearch={handleSearch}
        searchInput={searchInput}
        onSearchInputChange={handleSearchInputChange}
      />

      {/* Search Drawer */}
      <SearchDrawerWithSuspense
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        initialQuery={searchQuery}
        searchInput={searchInput}
        onSearchInputChange={handleSearchInputChange}
      />
    </>
  );
}
