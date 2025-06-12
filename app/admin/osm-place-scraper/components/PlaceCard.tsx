'use client';

import { useState } from 'react';
import { MapPin, ExternalLink, Check, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MappedPlace } from '../types';

interface PlaceCardProps {
  place: MappedPlace;
  selected: boolean;
  onToggleSelect: (placeId: string) => void;
}

export function PlaceCard({ place, selected, onToggleSelect }: PlaceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleSelectChange = (checked: boolean) => {
    onToggleSelect(place.id);
  };

  const openInOSM = () => {
    window.open(place.source_link, '_blank');
  };

  const coordinates = `${place.location.lat.toFixed(6)}, ${place.location.lng.toFixed(6)}`;

  return (
    <Card
      className={`transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={selected}
              onCheckedChange={handleSelectChange}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-1 truncate">
                {place.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {place.description}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{coordinates}</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={openInOSM}
            className="flex-shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="text-xs">
              {place.raw_data.class}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {place.raw_data.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              OSM
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="truncate">{place.location.name}</p>
            {place.location.street_address && (
              <p className="text-xs mt-1">{place.location.street_address}</p>
            )}
          </div>

          {expanded && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md space-y-2 text-sm">
              <div>
                <strong>Address Details:</strong>
                {place.raw_data.address && (
                  <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
                    {place.raw_data.address.road && (
                      <span>Road: {place.raw_data.address.road}</span>
                    )}
                    {place.raw_data.address.city && (
                      <span>City: {place.raw_data.address.city}</span>
                    )}
                    {place.raw_data.address.region && (
                      <span>Region: {place.raw_data.address.region}</span>
                    )}
                    {place.raw_data.address.country && (
                      <span>Country: {place.raw_data.address.country}</span>
                    )}
                    {place.raw_data.address.postcode && (
                      <span>Postcode: {place.raw_data.address.postcode}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <strong>OSM ID:</strong> {place.raw_data.osm_type}/
                {place.raw_data.osm_id}
              </div>

              <div>
                <strong>Importance:</strong>{' '}
                {(place.raw_data.importance * 100).toFixed(1)}%
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs"
          >
            {expanded ? 'Show Less' : 'Show More Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
