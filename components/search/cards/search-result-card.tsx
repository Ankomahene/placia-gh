'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Car,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  Star,
  Wifi,
} from 'lucide-react';
import { SafeImage } from '@/components/ui/safe-image';
import React from 'react';
import { SearchResult } from '../types';
import { cn } from '@/lib/utils';

interface SearchResultCardProps {
  result: SearchResult;
  isHovered?: boolean;
  isSelected?: boolean;
  onHover?: (resultId: string | null) => void;
  onSelect?: (resultId: string) => void;
  variant?: 'default' | 'compact' | 'list';
}

export function SearchResultCard({
  result,
  isHovered = false,
  isSelected = false,
  onHover,
  onSelect,
  variant = 'default',
}: SearchResultCardProps) {
  const handleMouseEnter = () => onHover?.(result.id);
  const handleMouseLeave = () => onHover?.(null);
  const handleClick = () => onSelect?.(result.id);

  const getCardClasses = () => {
    const baseClasses =
      'cursor-pointer transition-all duration-300 overflow-hidden group';
    const variantClasses = {
      default: 'h-full',
      compact: 'h-64',
      list: 'w-full',
    };
    const stateClasses =
      isHovered || isSelected
        ? 'shadow-lg border-primary/50 scale-[1.02]'
        : 'shadow-sm hover:shadow-md border-border';

    return `${baseClasses} ${variantClasses[variant]} ${stateClasses}`;
  };

  const renderSourceBadge = () => {
    if (result.source === 'google') {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
        >
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-xs bg-green-50 text-green-700 border-green-200"
      >
        <MapPin className="w-3 h-3 mr-1" />
        Local
      </Badge>
    );
  };

  const renderRating = () => {
    if (!result.rating) return null;

    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{result.rating.rate}</span>
        <span className="text-xs text-muted-foreground">
          ({result.rating.count})
        </span>
      </div>
    );
  };

  const renderTags = () => {
    if (!result.tags || result.tags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {result.tags.slice(0, 3).map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="text-xs px-2 py-0.5"
          >
            {tag.replace(/_/g, ' ')}
          </Badge>
        ))}
        {result.tags.length > 3 && (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            +{result.tags.length - 3}
          </Badge>
        )}
      </div>
    );
  };

  const renderFeatures = () => {
    // For local places
    if (
      result.source === 'local' &&
      result.place?.features &&
      result.place.features.length > 0
    ) {
      const iconMap: Record<string, React.ReactNode> = {
        WiFi: <Wifi className="h-3 w-3" />,
        Parking: <Car className="h-3 w-3" />,
        'Beach Access': <MapPin className="h-3 w-3" />,
      };

      return (
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {result.place.features.slice(0, 3).map((feature) => (
            <div key={feature.label} className="flex items-center gap-1">
              {iconMap[feature.label] || (
                <div className="w-3 h-3 rounded-full bg-muted" />
              )}
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      );
    }

    // For Google places, show open status if available
    if (
      result.source === 'google' &&
      result.googlePlace?.openNow !== undefined
    ) {
      return (
        <div className="flex items-center gap-2 mt-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${result.googlePlace.openNow ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span
            className={
              result.googlePlace.openNow ? 'text-green-600' : 'text-red-600'
            }
          >
            {result.googlePlace.openNow ? 'Open now' : 'Closed'}
          </span>
        </div>
      );
    }

    return null;
  };

  const renderContactInfo = () => {
    if (result.source === 'local' && result.place) {
      return (
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{result.location.name}</span>
          </div>
          {result.place.contacts && result.place.contacts[0] && (
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>{result.place.contacts[0]}</span>
            </div>
          )}
          {result.place.website && (
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span>Website</span>
            </div>
          )}
        </div>
      );
    }

    if (result.source === 'google' && result.googlePlace) {
      return (
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="truncate">
              {result.googlePlace.vicinity ||
                result.googlePlace.formattedAddress}
            </span>
          </div>
          {result.googlePlace.priceLevel !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-xs">
                {'$'.repeat(Math.max(1, result.googlePlace.priceLevel))}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 mb-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {result.location.name}
        </span>
      </div>
    );
  };

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={getCardClasses()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Image */}
              <div className="flex-shrink-0 w-32 h-24 bg-muted rounded-lg overflow-hidden">
                {result.image ? (
                  <SafeImage
                    src={result.image}
                    alt={result.name}
                    width={128}
                    height={96}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-primary/40" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">
                        {result.name}
                      </h3>
                      {renderSourceBadge()}
                    </div>
                    {result.source === 'local' && result.place?.tagline && (
                      <p className="text-sm text-muted-foreground">
                        {result.place.tagline}
                      </p>
                    )}
                  </div>
                  {renderRating()}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {result.description}
                </p>

                {renderContactInfo()}
                {renderFeatures()}

                <div className="flex items-center justify-between mt-3">
                  {renderTags()}
                  <Button variant="outline" size="sm" className="ml-auto">
                    View Details
                    {result.source === 'google' && (
                      <ExternalLink className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card
        className={cn(getCardClasses(), 'pt-0')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Image */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {result.image ? (
            <SafeImage
              src={result.image}
              alt={result.name}
              width={400}
              height={192}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary/40" />
            </div>
          )}

          {/* Source Badge */}
          <div className="absolute top-3 left-3">{renderSourceBadge()}</div>

          {/* Rating Badge */}
          {result.rating && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full">
              {renderRating()}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 truncate">{result.name}</h3>

          {result.source === 'local' && result.place?.tagline && (
            <p className="text-sm text-muted-foreground mb-2">
              {result.place.tagline}
            </p>
          )}

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {result.description}
          </p>

          <div className="flex items-center gap-1 mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground truncate">
              {result.location.name}
            </span>
          </div>

          {renderFeatures()}
          {renderTags()}
        </CardContent>
      </Card>
    </motion.div>
  );
}
