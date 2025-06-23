'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useSearchContext } from '@/components/search/hooks/use-search-context';

export function SmartBackButton() {
  const router = useRouter();
  const {
    getNavigationSource,
    restoreSearchState,
    setIsOpenSearchWindow,
    setSearchMode,
  } = useSearchContext();

  const [navigationSource, setNavigationSource] = useState<string | null>(null);

  useEffect(() => {
    // Get navigation source on mount
    setNavigationSource(getNavigationSource());
  }, [getNavigationSource]);

  const handleBack = () => {
    if (
      navigationSource === 'general_search' ||
      navigationSource === 'chat_search'
    ) {
      // User came from search, restore search state and open drawer
      const restored = restoreSearchState();
      if (restored) {
        // Set appropriate search mode
        setSearchMode(navigationSource === 'chat_search' ? 'chat' : 'general');
        // Open search drawer
        setIsOpenSearchWindow(true);
        // Navigate to home (search drawer will be open)
        router.push('/');
        return;
      }
    }

    // Default navigation - just go back to home
    router.push('/');
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        variant="secondary"
        size="sm"
        className="bg-white/90 dark:bg-black/60 backdrop-blur-sm hover:bg-white/100 dark:hover:bg-black/80 shadow-lg border-0"
        onClick={handleBack}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
        {navigationSource && navigationSource !== 'home' && (
          <span className="ml-1 text-xs opacity-75">
            to {navigationSource === 'general_search' ? 'Search' : 'Chat'}
          </span>
        )}
      </Button>
    </div>
  );
}
