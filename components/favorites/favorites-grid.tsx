'use client';

import PlaceCard from '@/components/place-card';
import { useFavorites } from '@/hooks/use-favorites';
import { Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FavoritesGrid() {
  const { favorites, favoritesCount, isLoggedIn } = useFavorites();

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Login to Save Favorites</h3>
        <p className="text-muted-foreground mb-4">
          Sign in to save your favorite places and access them from any device.
        </p>
        <Button asChild>
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (favoritesCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
        <p className="text-muted-foreground mb-4">
          Start exploring and save places you love to see them here.
        </p>
        <Button asChild>
          <Link href="/">
            <Plus className="h-4 w-4 mr-2" />
            Discover Places
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((place) => (
        <PlaceCard
          key={place.id}
          place={{
            ...place,
            source: (place.source as 'platform' | 'google') || 'platform',
          }}
        />
      ))}
    </div>
  );
}
