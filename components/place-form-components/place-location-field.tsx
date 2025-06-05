'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MapPin, Crosshair } from 'lucide-react';

interface LocationData {
  lng: number;
  lat: number;
  name: string;
  street_address: string;
}

interface PlaceLocationFieldProps {
  value: LocationData;
  onChange: (value: LocationData) => void;
  error?: string;
  className?: string;
  label?: string;
}

export function PlaceLocationField({
  value = { lng: 0, lat: 0, name: '', street_address: '' },
  onChange,
  error,
  className,
  label = 'Location',
}: PlaceLocationFieldProps) {
  const updateField = (
    field: keyof LocationData,
    newValue: string | number
  ) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateField('lat', position.coords.latitude);
          updateField('lng', position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert(
            'Unable to get your current location. Please enter coordinates manually.'
          );
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-red-500 ml-1">*</span>
      </Label>

      {/* Location Name */}
      <div className="space-y-2">
        <Label htmlFor="location-name" className="text-sm">
          Location Name
        </Label>
        <Input
          id="location-name"
          type="text"
          value={value.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., Downtown Plaza, Main Building"
          className={cn(error && 'border-red-500')}
          required
        />
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="street-address" className="text-sm">
          Street Address
        </Label>
        <Textarea
          id="street-address"
          value={value.street_address}
          onChange={(e) => updateField('street_address', e.target.value)}
          placeholder="Enter full street address"
          className={cn(error && 'border-red-500')}
          rows={2}
          required
        />
      </div>

      {/* Coordinates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Coordinates</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            className="h-8"
          >
            <Crosshair className="h-3 w-3 mr-1" />
            Use Current Location
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="latitude" className="text-xs text-muted-foreground">
              Latitude
            </Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={value.lat || ''}
              onChange={(e) =>
                updateField('lat', parseFloat(e.target.value) || 0)
              }
              placeholder="0.000000"
              className={cn(error && 'border-red-500')}
              required
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="longitude"
              className="text-xs text-muted-foreground"
            >
              Longitude
            </Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={value.lng || ''}
              onChange={(e) =>
                updateField('lng', parseFloat(e.target.value) || 0)
              }
              placeholder="0.000000"
              className={cn(error && 'border-red-500')}
              required
            />
          </div>
        </div>
      </div>

      {/* Map Preview/Link */}
      {value.lat !== 0 && value.lng !== 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Map Preview</Label>
          <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm flex-1">
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `https://www.google.com/maps?q=${value.lat},${value.lng}`;
                window.open(url, '_blank');
              }}
              className="h-7 text-xs"
            >
              View on Map
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
