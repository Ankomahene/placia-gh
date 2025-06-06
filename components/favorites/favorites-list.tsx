'use client';

import { Star, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockPlaces, Place } from '@/lib/mock-data';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function FavoritesList() {
  return (
    <div className="space-y-4">
      {mockPlaces.map((place: Place) => (
        <Card key={place.id} className="overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="flex flex-col sm:flex-row">
            {/* Image on the left */}
            <div className="relative w-full sm:w-48 h-48">
              <Image
                src={place.image}
                alt={place.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge
                  className={cn(
                    "px-2 py-1 text-xs font-medium",
                    place.isOpen 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {place.isOpen ? "Open" : "Closed"}
                </Badge>
              </div>
            </div>
            
            {/* Content on the right */}
            <CardContent className="flex-1 p-4 sm:p-6">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{place.name}</h3>
                      <p className="text-sm text-muted-foreground">{place.address}</p>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="text-sm font-medium">{place.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{place.distance}</span>
                    <span className="mx-1">•</span>
                    <span>{place.category}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">Parking</Badge>
                    <Badge variant="outline" className="text-xs">WiFi</Badge>
                    <Badge variant="outline" className="text-xs">Outdoor Seating</Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Remove</Button>
                    <Button size="sm">View Details</Button>
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