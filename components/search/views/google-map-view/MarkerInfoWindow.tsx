'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SafeImage } from '@/components/ui/safe-image';
import { Badge } from '@/components/ui/badge';
import { Navigation, Star, X } from 'lucide-react';
import { MarkerInfoWindowProps } from './types';

export function MarkerInfoWindow({
  marker,
  isVisible,
  onClose,
  onDirectionsRequest,
}: MarkerInfoWindowProps) {
  if (!isVisible) return null;

  return (
    <Card className="absolute top-4 left-4 w-80 p-4 shadow-lg border bg-background/95 backdrop-blur-sm z-10">
      <div className="flex items-start gap-3">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="w-3 h-3" />
        </Button>

        {/* Image */}
        <div className="w-16 h-16 relative flex-shrink-0 bg-muted rounded-md overflow-hidden">
          {marker.image ? (
            <SafeImage
              src={marker.image}
              alt={marker.name}
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
                className="w-6 h-6 text-primary/40"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm line-clamp-1">{marker.name}</h3>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  marker.isOpen ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  marker.isOpen ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {marker.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {marker.address}
          </p>

          <div className="flex items-center justify-between mb-3">
            {marker.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <span className="text-xs font-medium">{marker.rating}</span>
              </div>
            )}

            {marker.distance && (
              <div className="text-xs text-muted-foreground font-medium">
                {marker.distance}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {marker.category}
            </Badge>

            {onDirectionsRequest && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onDirectionsRequest}
              >
                <Navigation className="w-3 h-3 mr-1" />
                Directions
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
