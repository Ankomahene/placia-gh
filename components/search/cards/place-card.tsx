'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, Phone, Globe, Wifi, Car } from 'lucide-react';
import { Place } from '@/types/place';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface PlaceCardProps {
  place: Place;
  isHovered?: boolean;
  isSelected?: boolean;
  onHover?: (placeId: string | null) => void;
  onSelect?: (placeId: string) => void;
  variant?: 'default' | 'compact' | 'list';
}

export function PlaceCard({
  place,
  isHovered = false,
  isSelected = false,
  onHover,
  onSelect,
  variant = 'default',
}: PlaceCardProps) {
  const handleMouseEnter = () => onHover?.(place.id);
  const handleMouseLeave = () => onHover?.(null);
  const handleClick = () => onSelect?.(place.id);

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

  const renderRating = () => {
    if (!place.rating) return null;

    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{place.rating.rate}</span>
        <span className="text-xs text-muted-foreground">
          ({place.rating.count})
        </span>
      </div>
    );
  };

  const renderTags = () => {
    if (!place.tags || place.tags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {place.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
            {tag}
          </Badge>
        ))}
        {place.tags.length > 3 && (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            +{place.tags.length - 3}
          </Badge>
        )}
      </div>
    );
  };

  const renderFeatures = () => {
    if (!place.features || place.features.length === 0) return null;

    const iconMap: Record<string, React.ReactNode> = {
      WiFi: <Wifi className="h-3 w-3" />,
      Parking: <Car className="h-3 w-3" />,
      'Beach Access': <MapPin className="h-3 w-3" />,
    };

    return (
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        {place.features.slice(0, 3).map((feature) => (
          <div key={feature.label} className="flex items-center gap-1">
            {iconMap[feature.label] || (
              <div className="w-3 h-3 rounded-full bg-muted" />
            )}
            <span>{feature.label}</span>
          </div>
        ))}
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
                {place.main_image ? (
                  <Image
                    src={place.main_image}
                    alt={place.name}
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
                  <div>
                    <h3 className="font-semibold text-lg truncate">
                      {place.name}
                    </h3>
                    {place.tagline && (
                      <p className="text-sm text-muted-foreground">
                        {place.tagline}
                      </p>
                    )}
                  </div>
                  {renderRating()}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {place.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{place.location.name}</span>
                  </div>
                  {place.contacts && place.contacts[0] && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{place.contacts[0]}</span>
                    </div>
                  )}
                  {place.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span>Website</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {renderTags()}
                  <Button variant="outline" size="sm" className="ml-auto">
                    View Details
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
        className={getCardClasses()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Image */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {place.main_image ? (
            <Image
              src={place.main_image}
              alt={place.name}
              width={400}
              height={192}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary/40" />
            </div>
          )}

          {/* Rating Badge */}
          {place.rating && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full">
              {renderRating()}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 truncate">{place.name}</h3>

          {place.tagline && (
            <p className="text-sm text-muted-foreground mb-2">
              {place.tagline}
            </p>
          )}

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {place.description}
          </p>

          <div className="flex items-center gap-1 mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {place.location.name}
            </span>
          </div>

          {renderFeatures()}
          {renderTags()}
        </CardContent>
      </Card>
    </motion.div>
  );
}
