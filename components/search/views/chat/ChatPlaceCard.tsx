'use client';

import { PlaceResultsSummary } from '@/types/place';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Navigation, Heart, Clock } from 'lucide-react';
import { convertMetersToKm } from '@/lib/utils';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  getRatingLabel,
  getPriceLevelLabel,
  getPlaceDetailsUrl,
} from '@/lib/utils/place-utils';

interface ChatPlaceCardProps {
  place: PlaceResultsSummary;
  onHover: (id: string | null) => void;
  isSelected: boolean;
  onClick?: () => void;
}

export function ChatPlaceCard({
  place,
  onHover,
  isSelected,
  onClick,
}: ChatPlaceCardProps) {
  const ratingInfo = getRatingLabel(place.rate_average);
  const priceInfo = getPriceLevelLabel(place.price_level);
  const getDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.location.lng},${place.location.lat}`;
  const placeDetailsUrl = getPlaceDetailsUrl(place);

  const hasRating = place.rate_average && place.rate_average > 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg border-border hover:border-primary/50',
        isSelected &&
          'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg'
      )}
      onMouseEnter={() => onHover(place.id)}
      onMouseLeave={() => onHover(null)}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Image */}
          <div className="rounded-md overflow-hidden">
            <div className="relative w-24 h-24 bg-muted flex-shrink-0 overflow-hidden">
              {place.main_image ? (
                <Image
                  src={place.main_image}
                  alt={place.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary/40" />
                  </div>
                </div>
              )}

              {/* Source Badge */}
              <Badge
                className={cn(
                  'absolute top-1 right-1 text-xs',
                  place.source === 'google' || place.source === 'google_places'
                    ? 'bg-blue-500/90 hover:bg-blue-500 text-white border-0'
                    : 'bg-green-500/90 hover:bg-green-500 text-white border-0'
                )}
              >
                {place.source === 'google' || place.source === 'google_places'
                  ? 'G'
                  : 'P'}
              </Badge>

              {/* Open Status */}
              {place.open_now !== undefined && place.open_now !== 'unknown' && (
                <Badge
                  className={cn(
                    'absolute bottom-1 left-1 text-xs border-0',
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
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base text-foreground line-clamp-2 leading-tight">
                {place.name}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle favorite toggle
                }}
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>

            {/* Description */}
            {(place.description || place.location.street_address) && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {place.description || place.location.street_address}
              </p>
            )}

            {/* Category and Distance */}
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

            {/* Rating and Price */}
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

              {priceInfo.symbol && (
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={getDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button size="sm" className="w-full">
                  <Navigation className="w-3 h-3 mr-2" />
                  Directions
                </Button>
              </a>
              <Link href={placeDetailsUrl} onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
