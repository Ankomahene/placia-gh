import React from 'react';
import Header from '@/components/layout/header';
import HeroSection from '@/components/hero-section';
import FeaturedPlaces from '@/components/featured-places';
import TrendingPlaces from '@/components/trending-places';
import PopularCategories from '@/components/popular-categories';
import Footer from '@/components/layout/footer';
import { SearchClientWrapper } from '@/components/search/search-client-wrapper';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <SearchClientWrapper />
      <div className="container mx-auto px-4 py-12 space-y-20">
        <FeaturedPlaces />
        <TrendingPlaces />
        <PopularCategories />
      </div>
      <Footer />
    </main>
  );
}
