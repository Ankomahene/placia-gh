import { PlaceResultsSummary } from '@/types/place';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Clock, Navigation, Heart } from 'lucide-react';
import { convertMetersToKm } from '@/lib/utils';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SearchResultCardProps {
  place: PlaceResultsSummary;
  onHover: (id: string | null) => void;
  isSelected: boolean;
  variant?: 'card' | 'list';
  onClick?: () => void;
}

const getRatingLabel = (ratingLabel?: string) => {
  if (!ratingLabel) return { label: '', color: 'text-muted-foreground' };

  switch (ratingLabel) {
    case 'highly_rated':
      return { label: 'High', color: 'text-green-600 dark:text-green-400' };
    case 'well_rated':
      return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    case 'moderately_rated':
      return { label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' };
    case 'poorly_rated':
      return { label: 'Low', color: 'text-red-600 dark:text-red-400' };
    default:
      return { label: '', color: 'text-muted-foreground' };
  }
};

const getPriceLevelLabel = (priceLabel?: string) => {
  if (!priceLabel) return { label: '', symbol: '' };

  switch (priceLabel) {
    case 'very_expensive':
      return { label: 'Very Expensive', symbol: '$$$$' };
    case 'expensive':
      return { label: 'Expensive', symbol: '$$$' };
    case 'moderate':
      return { label: 'Moderate', symbol: '$$' };
    case 'budget_friendly':
      return { label: 'Budget', symbol: '$' };
    default:
      return { label: '', symbol: '' };
  }
};

export function SearchResultCard({
  place,
  onHover,
  isSelected,
  variant = 'card',
  onClick,
}: SearchResultCardProps) {
  const ratingInfo = getRatingLabel(place.rate_label);
  const priceInfo = getPriceLevelLabel(place.price_level_label);
  const getDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.location.lng},${place.location.lat}`;

  const isCardView = variant === 'card';
  const hasRating = place.rate_average && place.rate_average > 0;
  const hasPrice = place.price_level && place.price_level > 0;

  const ImageSection = () => (
    <div
      className={cn(
        'relative bg-muted flex-shrink-0 overflow-hidden',
        isCardView ? 'w-full h-48' : 'w-32 h-32'
      )}
    >
      {place.main_image ? (
        <Image
          src={place.main_image}
          alt={place.name}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes={
            isCardView
              ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
              : '128px'
          }
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary/40" />
          </div>
        </div>
      )}

      <Badge
        className={cn(
          'absolute top-2 right-2 text-xs',
          place.source === 'google'
            ? 'bg-blue-500/90 hover:bg-blue-500 text-white border-0'
            : 'bg-green-500/90 hover:bg-green-500 text-white border-0'
        )}
      >
        {place.source === 'google' ? 'G' : 'L'}
      </Badge>

      {place.open_now !== undefined && place.open_now !== 'unknown' && (
        <Badge
          className={cn(
            'absolute bottom-2 left-2 text-xs border-0',
            place.open_now
              ? 'bg-green-500/90 hover:bg-green-500 text-white'
              : 'bg-red-500/90 hover:bg-red-500 text-white'
          )}
        >
          <Clock className="w-3 h-3 mr-1" />
          {place.open_now ? 'Open' : 'Closed'}
        </Badge>
      )}
    </div>
  );

  const ContentSection = () => (
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          className={cn(
            'font-semibold text-foreground line-clamp-2 leading-tight',
            isCardView ? 'text-lg' : 'text-base'
          )}
        >
          {place.name}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Heart className="w-4 h-4" />
        </Button>
      </div>

      {(place.description || place.formatted_address) && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {place.description || place.formatted_address}
        </p>
      )}

      <div className="flex items-center text-xs text-muted-foreground gap-2 mb-3">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">
          {place.subcategory?.name || place.category?.name || 'Place'}
        </span>
        {place.distance && (
          <>
            <span>•</span>
            <span>{convertMetersToKm(place.distance)} km</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        {hasRating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-medium text-sm">
                {place.rate_average ? place.rate_average.toFixed(1) : ''}
              </span>
              <span className="text-xs text-muted-foreground">
                ({place.rate_count || 0})
              </span>
            </div>
            {ratingInfo.label && (
              <Badge
                variant="outline"
                className={cn('text-xs px-2 py-0', ratingInfo.color)}
              >
                {ratingInfo.label}
              </Badge>
            )}
          </div>
        )}

        {hasPrice && priceInfo.symbol && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {priceInfo.symbol}
            </span>
            {priceInfo.label && (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
              >
                {priceInfo.label}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <a
          href={getDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button size="sm" className="w-full">
            <Navigation className="w-3 h-3 mr-2" />
            Directions
          </Button>
        </a>
        {onClick && (
          <Button variant="outline" size="sm" onClick={onClick}>
            View
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg border-border hover:border-primary/50',
        isSelected &&
          'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg',
        isCardView ? 'h-full' : 'h-auto'
      )}
      onMouseEnter={() => onHover(place.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {isCardView ? (
          <div className="flex flex-col h-full">
            <ImageSection />
            <div className="p-4 flex-1">
              <ContentSection />
            </div>
          </div>
        ) : (
          <div className="flex gap-4 p-4">
            <ImageSection />
            <ContentSection />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
