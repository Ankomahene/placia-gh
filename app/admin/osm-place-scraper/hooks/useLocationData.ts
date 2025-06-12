'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Country, Region, City } from '@/types/place';

interface UseLocationDataResult {
  countries: Country[];
  regions: Region[];
  cities: City[];
  loadingLocations: boolean;
  locationError: string | null;
  getRegionsByCountry: (countryId: string) => Region[];
  getCitiesByRegion: (regionId: string) => City[];
}

export function useLocationData(): UseLocationDataResult {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadLocationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLocationData = async () => {
    try {
      setLoadingLocations(true);
      setLocationError(null);

      // Load countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (countriesError) throw countriesError;

      // Load regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (regionsError) throw regionsError;

      // Load cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (citiesError) throw citiesError;

      setCountries(countriesData || []);
      setRegions(regionsData || []);
      setCities(citiesData || []);
    } catch (error) {
      console.error('Error loading location data:', error);
      setLocationError(
        error instanceof Error ? error.message : 'Failed to load location data'
      );
    } finally {
      setLoadingLocations(false);
    }
  };

  const getRegionsByCountry = (countryId: string): Region[] => {
    return regions.filter((region) => region.country_id === countryId);
  };

  const getCitiesByRegion = (regionId: string): City[] => {
    return cities.filter((city) => city.region_id === regionId);
  };

  return {
    countries,
    regions,
    cities,
    loadingLocations,
    locationError,
    getRegionsByCountry,
    getCitiesByRegion,
  };
}
