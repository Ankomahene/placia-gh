'use client';

import { Star, MapPin, Heart, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/hooks/use-favorites';
import { PlaceResultsSummary } from '@/types/place';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function FavoritesList() {
  const { favorites, favoritesCount, isLoggedIn, removeFromFavorites } =
    useFavorites();

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
    <div className="space-y-4">
      {favorites.map((place: PlaceResultsSummary) => (
        <Card
          key={place.id}
          className="overflow-hidden hover:shadow-md transition-all duration-300"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Image on the left */}
            <div className="relative w-full sm:w-48 h-48">
              <Image
                src={
                  place.main_image ||
                  place.gallery?.[0] ||
                  '/placeholder-place.svg'
                }
                alt={place.name}
                fill
                className="object-cover"
              />
              {place.open_now !== undefined && place.open_now !== 'unknown' && (
                <div className="absolute top-2 right-2">
                  <Badge
                    className={cn(
                      'px-2 py-1 text-xs font-medium',
                      place.open_now
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    )}
                  >
                    {place.open_now ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content on the right */}
            <CardContent className="flex-1 p-4 sm:p-6">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{place.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {place.location?.street_address || place.description}
                      </p>
                    </div>
                    {place.rate_average !== undefined &&
                      place.rate_count !== undefined && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                          <span className="text-sm font-medium">
                            {place.rate_average.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({place.rate_count})
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {place.city?.name ||
                        place.region?.name ||
                        place.country?.name}
                    </span>
                    {place.category?.name && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{place.category.name}</span>
                      </>
                    )}
                  </div>

                  {place.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {place.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-2">
                    {place.features?.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature.label}
                      </Badge>
                    ))}
                    {place.services?.slice(0, 2).map((service, index) => (
                      <Badge
                        key={`service-${index}`}
                        variant="outline"
                        className="text-xs"
                      >
                        {service.label}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromFavorites(place.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                    <Button asChild size="sm">
                      <Link
                        href={`/place/${place.id}?source=${place.source || 'platform'}`}
                      >
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
}
