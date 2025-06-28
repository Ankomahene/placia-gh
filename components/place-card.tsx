import { Star, Navigation, ExternalLink, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlaceResultsSummary } from '@/types/place';
import { useFavorites } from '@/hooks/use-favorites';
import Link from 'next/link';

interface PlaceCardProps {
  place: PlaceResultsSummary & {
    distance?: number;
    source?: 'platform' | 'google';
  };
  className?: string;
}

export default function PlaceCard({ place, className }: PlaceCardProps) {
  const { toggleFavorite, isFavorite, canAddToFavorites, isLoggedIn } =
    useFavorites();

  const isPlaceFavorited = isFavorite(place.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(place);
  };

  const handleGetDirections = () => {
    if (!place.location) return;

    // Get user's location if available from navigator
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const destination = `${place.location.lat},${place.location.lng}`;
          window.open(
            `https://www.google.com/maps/dir/${origin}/${destination}`,
            '_blank'
          );
        },
        () => {
          // If user denies location or error, just navigate to destination
          const destination = `${place.location.lat},${place.location.lng}`;
          window.open(
            `https://www.google.com/maps/dir//${destination}`,
            '_blank'
          );
        }
      );
    } else {
      // Fallback if geolocation not available
      const destination = `${place.location.lat},${place.location.lng}`;
      window.open(`https://www.google.com/maps/dir//${destination}`, '_blank');
    }
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-md group pt-0',
        className
      )}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors z-10"></div>
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${place.main_image || place.gallery?.[0] || '/placeholder-place.svg'})`,
          }}
        />
        {place.open_now !== undefined && (
          <div className="absolute top-3 right-3 z-20">
            <Badge
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                place.open_now
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {place.open_now ? 'Open' : 'Closed'}
            </Badge>
          </div>
        )}

        {/* Favorites Heart Button */}
        {isLoggedIn && (
          <div className="absolute bottom-3 right-3 z-20">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm shadow-lg border-0 transition-all duration-200',
                'hover:bg-white dark:hover:bg-black/80 hover:scale-110',
                isPlaceFavorited && 'bg-red-50 dark:bg-red-950/50'
              )}
              onClick={handleToggleFavorite}
              title={
                isPlaceFavorited ? 'Remove from favorites' : 'Add to favorites'
              }
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  isPlaceFavorited
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600 dark:text-gray-300'
                )}
              />
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1 mb-1">
          {place.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
          {place.location?.street_address || place.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          {place.rate_average !== undefined &&
            place.rate_count !== undefined && (
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400 mr-1" />
                <span className="text-sm font-medium">
                  {place.rate_average.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({place.rate_count})
                </span>
              </div>
            )}
          {place.distance !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {place.distance.toFixed(1)} km
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="default" className="flex-1">
            <Link
              href={`/place/${place.id}?source=${place.source || 'platform'}`}
            >
              View Details
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleGetDirections}
            title="Get Directions"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
