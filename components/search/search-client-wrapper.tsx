'use client';

import HeroSection from '@/components/hero-section';
import { Suspense } from 'react';
import { SearchContextProvider } from './context';
import { SearchDrawer } from './search-drawer';

export function SearchClientWrapper() {
  return (
    <SearchContextProvider>
      <HeroSection />

      {/* Search Drawer */}
      <Suspense fallback={<div></div>}>
        <SearchDrawer />
      </Suspense>
    </SearchContextProvider>
  );
}
