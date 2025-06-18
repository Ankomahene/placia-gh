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
    <Card className="w-80 p-3 shadow-xl border bg-background/95 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-start gap-3">
        {/* Close Button - Only show if onClose is provided */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-70 hover:opacity-100"
            onClick={onClose}
          >
            <X className="w-3 h-3" />
          </Button>
        )}

        {/* Image */}
        <div className="w-14 h-14 relative flex-shrink-0 bg-muted rounded-lg overflow-hidden">
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
                className="w-5 h-5 text-primary/40"
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
            <h3 className="font-semibold text-sm line-clamp-1">
              {marker.name}
            </h3>
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

          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {marker.address}
          </p>

          <div className="flex items-center justify-between mb-2">
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
            <Badge variant="secondary" className="text-xs px-2 py-0">
              {marker.category}
            </Badge>

            {onDirectionsRequest && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onDirectionsRequest();
                }}
              >
                <Navigation className="w-3 h-3 mr-1" />
                Directions
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Arrow pointing down to marker */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-4 h-4 bg-background border-r border-b border-border transform rotate-45" />
      </div>
    </Card>
  );
}
