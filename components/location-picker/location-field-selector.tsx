'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useCities,
  useCountries,
  useRegions,
} from '@/hooks/use-countries-regions';
import { useTowns } from '@/hooks/use-towns';
import {
  LocationComponents,
  MatchedLocation,
  matchLocationToDatabase,
} from '@/lib/services/location-matching';
import { cn } from '@/lib/utils';
import { AlertCircle, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PlaceCityField } from '../place-form-components/place-city-field';
import { PlaceCountryField } from '../place-form-components/place-country-field';
import { PlaceRegionField } from '../place-form-components/place-region-field';
import { PlaceTownField } from '../place-form-components/place-town-field';
import { LocationSearchInput } from './location-search-input';

interface LocationFieldSelectorProps {
  value?: {
    country_id?: string;
    region_id?: string;
    city_id?: string;
    town_id?: string;
    location?: {
      lng: number;
      lat: number;
      name: string;
      street_address: string;
    };
  };
  onChange?: (location: MatchedLocation) => void;
  className?: string;
  required?: boolean;
  error?: string;
}

export function LocationFieldSelector({
  value,
  onChange,
  className,
  required = false,
  error,
}: LocationFieldSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedTown, setSelectedTown] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [matchedLocation, setMatchedLocation] =
    useState<MatchedLocation | null>(null);

  const { data: countries } = useCountries();
  const { data: regions } = useRegions(selectedCountry?.id || '');
  const { data: cities } = useCities(selectedRegion?.id || '');
  const { data: towns } = useTowns(selectedCity?.id || '');

  // Initialize from value prop
  useEffect(() => {
    if (value?.country_id && countries) {
      const country = countries.find((c) => c.id === value.country_id);
      if (country) {
        setSelectedCountry({ id: country.id, name: country.name });
      }
    }
  }, [value?.country_id, countries]);

  useEffect(() => {
    if (value?.region_id && regions) {
      const region = regions.find((r) => r.id === value.region_id);
      if (region) {
        setSelectedRegion({ id: region.id, name: region.name });
      }
    }
  }, [value?.region_id, regions]);

  useEffect(() => {
    if (value?.city_id && cities) {
      const city = cities.find((c) => c.id === value.city_id);
      if (city) {
        setSelectedCity({ id: city.id, name: city.name });
      }
    }
  }, [value?.city_id, cities]);

  useEffect(() => {
    if (value?.town_id && towns) {
      const town = towns.find((t) => t.id === value.town_id);
      if (town) {
        setSelectedTown({ id: town.id, name: town.name });
      }
    }
  }, [value?.town_id, towns]);

  // Update matched location when selections change
  useEffect(() => {
    if (selectedCountry || selectedRegion || selectedCity || selectedTown) {
      const location: MatchedLocation = {
        ...(selectedCountry && { country_id: selectedCountry.id }),
        ...(selectedRegion && { region_id: selectedRegion.id }),
        ...(selectedCity && { city_id: selectedCity.id }),
        ...(selectedTown && { town_id: selectedTown.id }),
        location: value?.location || {
          lng: 0,
          lat: 0,
          name:
            selectedCity?.name ||
            selectedTown?.name ||
            selectedRegion?.name ||
            selectedCountry?.name ||
            'Unknown Location',
          street_address: '',
        },
        components: {
          ...(selectedCountry && { country: selectedCountry.name }),
          ...(selectedRegion && { region: selectedRegion.name }),
          ...(selectedCity && { city: selectedCity.name }),
          ...(selectedTown && { town: selectedTown.name }),
          latitude: value?.location?.lat || 0,
          longitude: value?.location?.lng || 0,
          address: value?.location?.street_address || '',
        },
      };
      setMatchedLocation(location);
      onChange?.(location);
    }
  }, [
    selectedCountry,
    selectedRegion,
    selectedCity,
    selectedTown,
    value?.location,
    onChange,
  ]);

  const handleCountryChange = (countryId: string) => {
    const country = countries?.find((c) => c.id === countryId);
    if (country) {
      setSelectedCountry({ id: country.id, name: country.name });
      // Reset dependent selections
      setSelectedRegion(null);
      setSelectedCity(null);
      setSelectedTown(null);
    }
  };

  const handleRegionChange = (regionId: string) => {
    const region = regions?.find((r) => r.id === regionId);
    if (region) {
      setSelectedRegion({ id: region.id, name: region.name });
      // Reset dependent selections
      setSelectedCity(null);
      setSelectedTown(null);
    }
  };

  const handleCityChange = (cityId: string) => {
    const city = cities?.find((c) => c.id === cityId);
    if (city) {
      setSelectedCity({ id: city.id, name: city.name });
      // Reset dependent selections
      setSelectedTown(null);
    }
  };

  const handleTownChange = (townId: string) => {
    const town = towns?.find((t) => t.id === townId);
    if (town) {
      setSelectedTown({ id: town.id, name: town.name });
    }
  };

  const handleLocationSearch = async (components: LocationComponents) => {
    try {
      const matched = await matchLocationToDatabase(components);
      setMatchedLocation(matched);
      onChange?.(matched);

      // Auto-populate dropdowns based on matched IDs
      if (matched.country_id && countries) {
        const country = countries.find((c) => c.id === matched.country_id);
        if (country) {
          setSelectedCountry({ id: country.id, name: country.name });
        }
      }

      // Wait for regions to load, then set region
      if (matched.region_id) {
        setTimeout(() => {
          const region = regions?.find((r) => r.id === matched.region_id);
          if (region) {
            setSelectedRegion({ id: region.id, name: region.name });
          }
        }, 100);
      }

      // Wait for cities to load, then set city
      if (matched.city_id) {
        setTimeout(() => {
          const city = cities?.find((c) => c.id === matched.city_id);
          if (city) {
            setSelectedCity({ id: city.id, name: city.name });
          }
        }, 200);
      }

      // Wait for towns to load, then set town
      if (matched.town_id) {
        setTimeout(() => {
          const town = towns?.find((t) => t.id === matched.town_id);
          if (town) {
            setSelectedTown({ id: town.id, name: town.name });
          }
        }, 300);
      }
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Location Search at the top */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Location
        </label>
        <LocationSearchInput
          onLocationSelect={handleLocationSearch}
          placeholder="Search for a location by name or address..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Search first to auto-populate the fields below, or select manually
        </p>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>

      {/* Location fields in order: Country → Region → City → Town */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <PlaceCountryField
            value={selectedCountry?.id || ''}
            onChange={handleCountryChange}
            required={required}
            label="Country"
          />
        </div>

        <div>
          <PlaceRegionField
            countryId={selectedCountry?.id || ''}
            value={selectedRegion?.id || ''}
            onChange={handleRegionChange}
            label="Region"
          />
        </div>

        <div>
          <PlaceCityField
            regionId={selectedRegion?.id || ''}
            value={selectedCity?.id || ''}
            onChange={handleCityChange}
            label="City"
          />
        </div>

        <div>
          <PlaceTownField
            cityId={selectedCity?.id || ''}
            value={selectedTown?.id || ''}
            onChange={handleTownChange}
            label="Town"
          />
        </div>
      </div>

      {/* Location Summary/Results at the bottom */}
      {matchedLocation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  Location Components:
                </h4>
                <div className="space-y-1 text-gray-700">
                  {matchedLocation.components.country && (
                    <p>
                      <strong>Country:</strong>{' '}
                      {matchedLocation.components.country}
                    </p>
                  )}
                  {matchedLocation.components.region && (
                    <p>
                      <strong>Region:</strong>{' '}
                      {matchedLocation.components.region}
                    </p>
                  )}
                  {matchedLocation.components.city && (
                    <p>
                      <strong>City:</strong> {matchedLocation.components.city}
                    </p>
                  )}
                  {matchedLocation.components.town && (
                    <p className="text-gray-600">
                      <strong>Town:</strong> {matchedLocation.components.town}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  Database Matches:
                </h4>
                <div className="space-y-1 text-gray-700">
                  <p>
                    <strong>Country ID:</strong>{' '}
                    {matchedLocation.country_id || 'Not matched'}
                  </p>
                  <p>
                    <strong>Region ID:</strong>{' '}
                    {matchedLocation.region_id || 'Not matched'}
                  </p>
                  <p>
                    <strong>City ID:</strong>{' '}
                    {matchedLocation.city_id || 'Not matched'}
                  </p>
                  <p>
                    <strong>Town ID:</strong>{' '}
                    {matchedLocation.town_id || 'Not matched'}
                  </p>
                </div>
              </div>
            </div>

            {matchedLocation.location && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">
                  Location Data:
                </h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <strong>Coordinates:</strong>{' '}
                    {matchedLocation.location.lat.toFixed(6)},{' '}
                    {matchedLocation.location.lng.toFixed(6)}
                  </p>
                  <p>
                    <strong>Name:</strong> {matchedLocation.location.name}
                  </p>
                  {matchedLocation.components.address && (
                    <p>
                      <strong>Address:</strong>{' '}
                      {matchedLocation.components.address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Show warning for unmatched items */}
            {(!matchedLocation.country_id ||
              !matchedLocation.region_id ||
              !matchedLocation.city_id) && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {!matchedLocation.country_id && 'Country not matched. '}
                  {!matchedLocation.region_id && 'Region not matched. '}
                  {!matchedLocation.city_id && 'City not matched. '}
                  Location data will be used as-is for this place.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
