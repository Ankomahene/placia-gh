'use client';

import { FavoritesGrid } from '@/components/favorites/favorites-grid';
import { FavoritesList } from '@/components/favorites/favorites-list';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFavorites } from '@/hooks/use-favorites';
import { LayoutGrid, List, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function FavoritesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { favoritesCount, clearFavorites, isLoggedIn } = useFavorites();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Favorites</h1>
          <p className="text-muted-foreground mt-2">
            Places you&apos;ve saved for later.
            {isLoggedIn && favoritesCount > 0 && (
              <span className="ml-2 text-sm font-medium">
                ({favoritesCount} {favoritesCount === 1 ? 'place' : 'places'})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear All Button */}
          {isLoggedIn && favoritesCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Favorites?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all {favoritesCount} places
                    from your favorites list. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearFavorites}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* View Toggle Buttons */}
          <div className="border-l pl-2 ml-2">
            <div className="flex items-center gap-1">
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('grid')}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setView('list')}
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {view === 'grid' ? <FavoritesGrid /> : <FavoritesList />}
    </div>
  );
}
