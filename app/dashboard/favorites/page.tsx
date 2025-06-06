'use client';

import { FavoritesGrid } from '@/components/favorites/favorites-grid';
import { FavoritesList } from '@/components/favorites/favorites-list';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';

export default function FavoritesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Favorites</h1>
          <p className="text-muted-foreground mt-2">
            Places you&apos;ve saved for later.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'grid' ? <FavoritesGrid /> : <FavoritesList />}
    </div>
  );
}
