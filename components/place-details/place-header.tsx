'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceResults } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Share2, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign,
  Camera,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PlaceHeaderProps {
  place: PlaceResults;
}

export function PlaceHeader({ place }: PlaceHeaderProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  // Generate a placeholder gradient if no image
  const placeholderStyle = {
    background: `linear-gradient(135deg, hsl(${Math.floor(Math.random() * 360)}, 70%, 60%), hsl(${Math.floor(Math.random() * 360)}, 70%, 40%))`,
  };
  
  // Format price level
  const getPriceLevel = () => {
    if (!place.price_level) return null;
    return Array(place.price_level).fill('$').join('');
  };
  
  return (
    <div className="relative">
      {/* Cover image or placeholder */}
      <div className="w-full h-64 md:h-80 lg:h-96 relative">
        {place.main_image ? (
          <Image 
            src={place.main_image} 
            alt={place.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={placeholderStyle}
          >
            <div className="text-white text-6xl opacity-30">
              <Camera className="w-24 h-24" />
            </div>
          </div>
        )}
        
        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/">
            <Button variant="secondary" size="sm" className="bg-background/80 backdrop-blur-sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-background/80 backdrop-blur-sm"
            onClick={toggleFavorite}
          >
            <Heart 
              className={cn(
                "h-4 w-4 mr-1", 
                isFavorite && "fill-red-500 text-red-500"
              )} 
            />
            {isFavorite ? 'Saved' : 'Save'}
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-background/80 backdrop-blur-sm"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background to-transparent h-32"></div>
      </div>
      
      {/* Place info overlay */}
      <div className="container mx-auto px-4 relative -mt-16 z-10">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Logo/icon */}
          {place.logo && (
            <div className="w-24 h-24 rounded-xl overflow-hidden border-4 border-background shadow-lg bg-background">
              <Image 
                src={place.logo} 
                alt={`${place.name} logo`}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Title and basic info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">{place.name}</h1>
            
            {place.tagline && (
              <p className="text-muted-foreground mt-1">{place.tagline}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {/* Category */}
              {place.category && (
                <Badge variant="outline" className="text-xs">
                  {place.category.name}
                </Badge>
              )}
              
              {/* Subcategory */}
              {place.subcategory && (
                <Badge variant="outline" className="text-xs">
                  {place.subcategory.name}
                </Badge>
              )}
              
              {/* Location */}
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span>
                  {place.location?.street_address || 
                   `${place.city?.name || ''}, ${place.region?.name || ''}`}
                </span>
              </div>
              
              {/* Rating */}
              {place.rate_average && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                  <span className="font-medium">{place.rate_average.toFixed(1)}</span>
                  {place.rate_count && (
                    <span className="text-muted-foreground text-sm ml-1">
                      ({place.rate_count})
                    </span>
                  )}
                </div>
              )}
              
              {/* Open status */}
              {place.open_now !== undefined && place.open_now !== 'unknown' && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className={place.open_now ? "text-green-600" : "text-red-600"}>
                    {place.open_now ? 'Open now' : 'Closed'}
                  </span>
                </div>
              )}
              
              {/* Price level */}
              {place.price_level && (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{getPriceLevel()}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick action buttons */}
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button className="bg-primary hover:bg-primary/90">
              <MapPin className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}