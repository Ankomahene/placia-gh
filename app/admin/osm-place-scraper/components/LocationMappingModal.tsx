'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertCircle, Users, Copy } from 'lucide-react';
import { useLocationData } from '../hooks/useLocationData';
import { useCategoryData } from '../hooks/useCategoryData';
import { MappedPlace } from '../types';

interface LocationMapping {
  place_id: string;
  country_id: string;
  region_id: string;
  city_id: string;
  category_id: string;
  subcategory_id: string;
}

interface LocationMappingModalProps {
  open: boolean;
  onClose: () => void;
  places: MappedPlace[];
  onSaveWithMappings: (mappings: LocationMapping[]) => void;
  saving: boolean;
}

export function LocationMappingModal({
  open,
  onClose,
  places,
  onSaveWithMappings,
  saving,
}: LocationMappingModalProps) {
  const {
    countries,
    regions,
    cities,
    loadingLocations,
    locationError,
    getRegionsByCountry,
    getCitiesByRegion,
  } = useLocationData();

  const {
    categories,
    subcategories,
    loadingCategories,
    categoryError,
    getSubcategoriesByCategory,
  } = useCategoryData();

  const [mappings, setMappings] = useState<Record<string, LocationMapping>>({});
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);

  // Bulk selection states
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkSubcategory, setBulkSubcategory] = useState('');
  const [bulkCountry, setBulkCountry] = useState('');
  const [bulkRegion, setBulkRegion] = useState('');
  const [bulkCity, setBulkCity] = useState('');

  useEffect(() => {
    if (places.length > 0) {
      const initialMappings: Record<string, LocationMapping> = {};

      places.forEach((place) => {
        const suggestion = suggestLocationMapping(
          place,
          countries,
          regions,
          cities
        );
        initialMappings[place.id] = {
          place_id: place.id,
          country_id: suggestion.country_id || '',
          region_id: suggestion.region_id || '',
          city_id: suggestion.city_id || '',
          category_id: '',
          subcategory_id: '',
        };
      });

      setMappings(initialMappings);
    }
  }, [places, countries, regions, cities]);

  const currentPlace = places[currentPlaceIndex];
  const currentMapping = mappings[currentPlace?.id] || {
    place_id: currentPlace?.id || '',
    country_id: '',
    region_id: '',
    city_id: '',
    category_id: '',
    subcategory_id: '',
  };

  const handleMappingChange = (field: keyof LocationMapping, value: string) => {
    setMappings((prev) => ({
      ...prev,
      [currentPlace.id]: {
        ...prev[currentPlace.id],
        [field]: value,
        // Reset dependent fields when parent changes
        ...(field === 'country_id' && { region_id: '', city_id: '' }),
        ...(field === 'region_id' && { city_id: '' }),
        ...(field === 'category_id' && { subcategory_id: '' }),
      },
    }));
  };

  // Bulk application functions
  const applyBulkCategory = () => {
    if (!bulkCategory || !bulkSubcategory) return;

    setMappings((prev) => {
      const updated = { ...prev };
      places.forEach((place) => {
        if (updated[place.id]) {
          updated[place.id] = {
            ...updated[place.id],
            category_id: bulkCategory,
            subcategory_id: bulkSubcategory,
          };
        }
      });
      return updated;
    });
  };

  const applyBulkLocation = () => {
    if (!bulkCountry) return;

    setMappings((prev) => {
      const updated = { ...prev };
      places.forEach((place) => {
        if (updated[place.id]) {
          updated[place.id] = {
            ...updated[place.id],
            country_id: bulkCountry,
            region_id: bulkRegion,
            city_id: bulkCity,
          };
        }
      });
      return updated;
    });
  };

  const handleSave = () => {
    const mappingsList = Object.values(mappings).filter(
      (m) =>
        m.country_id &&
        m.region_id &&
        m.city_id &&
        m.category_id &&
        m.subcategory_id
    );
    onSaveWithMappings(mappingsList);
  };

  const availableRegions = currentMapping.country_id
    ? getRegionsByCountry(currentMapping.country_id)
    : [];

  const availableCities = currentMapping.region_id
    ? getCitiesByRegion(currentMapping.region_id)
    : [];

  const availableSubcategories = currentMapping.category_id
    ? getSubcategoriesByCategory(currentMapping.category_id)
    : [];

  // Bulk selection helpers
  const bulkAvailableRegions = bulkCountry
    ? getRegionsByCountry(bulkCountry)
    : [];
  const bulkAvailableCities = bulkRegion ? getCitiesByRegion(bulkRegion) : [];
  const bulkAvailableSubcategories = bulkCategory
    ? getSubcategoriesByCategory(bulkCategory)
    : [];

  const completedMappings = Object.values(mappings).filter(
    (m) =>
      m.country_id &&
      m.region_id &&
      m.city_id &&
      m.category_id &&
      m.subcategory_id
  ).length;

  if (loadingLocations || loadingCategories) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (locationError || categoryError) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8 text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>Error loading data: {locationError || categoryError}</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentPlace) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl !w-[70vw] max-h-[90vh] overflow-y-auto sm:!max-w-6xl md:!max-w-6xl lg:!max-w-6xl xl:!max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map Locations & Categories to Database
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bulk Selection Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">
                Bulk Apply Settings
              </h3>
              <Badge variant="secondary">{places.length} places</Badge>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Bulk Category Selection */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-700">
                  Apply Category to All Places
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    value={bulkCategory}
                    onValueChange={(value) => {
                      setBulkCategory(value);
                      setBulkSubcategory('');
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={bulkSubcategory}
                    onValueChange={setBulkSubcategory}
                    disabled={!bulkCategory}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {bulkAvailableSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.icon} {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={applyBulkCategory}
                  disabled={!bulkCategory || !bulkSubcategory}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Apply to All Places
                </Button>
              </div>

              {/* Bulk Location Selection */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-700">
                  Apply Location to All Places
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    value={bulkCountry}
                    onValueChange={(value) => {
                      setBulkCountry(value);
                      setBulkRegion('');
                      setBulkCity('');
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.emoji} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={bulkRegion}
                    onValueChange={(value) => {
                      setBulkRegion(value);
                      setBulkCity('');
                    }}
                    disabled={!bulkCountry}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      {bulkAvailableRegions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={bulkCity}
                    onValueChange={setBulkCity}
                    disabled={!bulkRegion}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      {bulkAvailableCities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={applyBulkLocation}
                  disabled={!bulkCountry}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Apply to All Places
                </Button>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div>
              <span className="text-sm font-medium">
                Place {currentPlaceIndex + 1} of {places.length}
              </span>
              <div className="text-xs text-muted-foreground mt-1">
                {completedMappings} of {places.length} places mapped
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPlaceIndex(Math.max(0, currentPlaceIndex - 1))
                }
                disabled={currentPlaceIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPlaceIndex(
                    Math.min(places.length - 1, currentPlaceIndex + 1)
                  )
                }
                disabled={currentPlaceIndex === places.length - 1}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Current place info */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-xl mb-3">{currentPlace.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {currentPlace.description}
            </p>

            {currentPlace.raw_data.address && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {currentPlace.raw_data.address.country && (
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      Country
                    </Badge>
                    <span className="font-medium">
                      {currentPlace.raw_data.address.country}
                    </span>
                  </div>
                )}
                {currentPlace.raw_data.address.region && (
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      Region
                    </Badge>
                    <span className="font-medium">
                      {currentPlace.raw_data.address.region}
                    </span>
                  </div>
                )}
                {(currentPlace.raw_data.address.city ||
                  currentPlace.raw_data.address.town) && (
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      City
                    </Badge>
                    <span className="font-medium">
                      {currentPlace.raw_data.address.city ||
                        currentPlace.raw_data.address.town}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Individual place mapping form */}
          <div className="space-y-8">
            {/* Location Section */}
            <div>
              <h4 className="text-xl font-semibold mb-6">
                Individual Location Mapping
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country *
                  </Label>
                  <Select
                    value={currentMapping.country_id}
                    onValueChange={(value) =>
                      handleMappingChange('country_id', value)
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.emoji} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="region" className="text-sm font-medium">
                    Region *
                  </Label>
                  <Select
                    value={currentMapping.region_id}
                    onValueChange={(value) =>
                      handleMappingChange('region_id', value)
                    }
                    disabled={!currentMapping.country_id}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRegions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City *
                  </Label>
                  <Select
                    value={currentMapping.city_id}
                    onValueChange={(value) =>
                      handleMappingChange('city_id', value)
                    }
                    disabled={!currentMapping.region_id}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Category Section */}
            <div>
              <h4 className="text-xl font-semibold mb-6">
                Individual Category Mapping
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <Select
                    value={currentMapping.category_id}
                    onValueChange={(value) =>
                      handleMappingChange('category_id', value)
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="subcategory" className="text-sm font-medium">
                    Subcategory *
                  </Label>
                  <Select
                    value={currentMapping.subcategory_id}
                    onValueChange={(value) =>
                      handleMappingChange('subcategory_id', value)
                    }
                    disabled={!currentMapping.category_id}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.icon} {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-11 px-8"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving || completedMappings === 0}
              className="bg-green-600 hover:bg-green-700 h-11 px-8"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                `Save ${completedMappings} Mapped Places`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function suggestLocationMapping(
  place: MappedPlace,
  countries: any[],
  regions: any[],
  cities: any[]
) {
  const address = place.raw_data.address;
  if (!address) return {};

  let suggestions: any = {};

  if (address.country) {
    const countryName = address.country.toLowerCase();
    const matchedCountry = countries.find(
      (c) =>
        c.name.toLowerCase().includes(countryName) ||
        countryName.includes(c.name.toLowerCase())
    );
    if (matchedCountry) {
      suggestions.country_id = matchedCountry.id;

      if (address.region || address.state) {
        const searchTerm = (address.region || address.state)?.toLowerCase();
        if (searchTerm) {
          const matchedRegion = regions.find(
            (r) =>
              r.country_id === matchedCountry.id &&
              (r.name.toLowerCase().includes(searchTerm) ||
                searchTerm.includes(r.name.toLowerCase()))
          );
          if (matchedRegion) {
            suggestions.region_id = matchedRegion.id;

            if (address.city || address.town) {
              const citySearchTerm = (
                address.city || address.town
              )?.toLowerCase();
              if (citySearchTerm) {
                const matchedCity = cities.find(
                  (c) =>
                    c.region_id === matchedRegion.id &&
                    (c.name.toLowerCase().includes(citySearchTerm) ||
                      citySearchTerm.includes(c.name.toLowerCase()))
                );
                if (matchedCity) {
                  suggestions.city_id = matchedCity.id;
                }
              }
            }
          }
        }
      }
    }
  }

  return suggestions;
}
