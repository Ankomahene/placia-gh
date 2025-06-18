'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/ui/safe-image';
import { Navigation, Star } from 'lucide-react';
import { PlaceCardProps } from './types';

export function PlaceCard({
  place,
  isHovered,
  isSelected,
  onHover,
  onClick,
  onDirectionsRequest,
  mapMarker,
  cardRef,
}: PlaceCardProps) {
  return (
    <div
      ref={cardRef}
      className={`
        border rounded-lg overflow-hidden transition-all duration-200 cursor-pointer
        ${
          isHovered || isSelected
            ? 'border-primary shadow-md'
            : 'border-border hover:border-primary/50'
        }
      `}
      onMouseEnter={() => onHover(place.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(place.id)}
    >
      <div className="flex">
        {/* Place Image */}
        <div className="w-24 h-24 relative flex-shrink-0 bg-muted">
          {place.main_image ? (
            <SafeImage
              src={place.main_image}
              alt={place.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-8 h-8 text-primary/40"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          )}
        </div>

        {/* Place Info */}
        <div className="p-3 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm line-clamp-1">
                  {place.name}
                </h3>
                {place.source === 'google' ? (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-1 py-0"
                  >
                    G
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200 px-1 py-0"
                  >
                    L
                  </Badge>
                )}
              </div>
            </div>
            <div className="ml-2 flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  mapMarker?.isOpen ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  mapMarker?.isOpen ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {mapMarker?.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {place.location.name}
          </p>

          <div className="flex items-center justify-between mt-2">
            {place.rate_average && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <span className="text-xs font-medium">
                  {place.rate_average}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({place.rate_count || 0})
                </span>
              </div>
            )}

            <div className="text-xs text-muted-foreground font-medium">
              {mapMarker?.distance}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div
              className="text-xs cursor-pointer text-primary hover:underline flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onClick(place.id);
              }}
            >
              View details
            </div>

            {onDirectionsRequest && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDirectionsRequest(place.id);
                }}
              >
                <Navigation className="w-3 h-3 mr-1" />
                Directions
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
