'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/header';
import HeroSection from '@/components/hero-section';
import FeaturedPlaces from '@/components/featured-places';
import TrendingPlaces from '@/components/trending-places';
import PopularCategories from '@/components/popular-categories';
import Footer from '@/components/layout/footer';
import { SearchDrawer } from '@/components/search';

export default function Home() {
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
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection
        onSearch={handleSearch}
        searchInput={searchInput}
        onSearchInputChange={handleSearchInputChange}
      />
      <div className="container mx-auto px-4 py-12 space-y-20">
        <FeaturedPlaces />
        <TrendingPlaces />
        <PopularCategories />
      </div>
      <Footer />

      {/* Search Drawer */}
      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        initialQuery={searchQuery}
        searchInput={searchInput}
        onSearchInputChange={handleSearchInputChange}
      />
    </main>
  );
}
