'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getCountries,
  getCountryById,
  getRegions,
  getRegionById,
  getCities,
  getCityById,
} from '@/lib/services/location';
import { Country, Region, City } from '@/types/place';

// React Query hooks
export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
  });
};

export const useRegions = (countryId: string) => {
  return useQuery({
    queryKey: ['regions', countryId],
    queryFn: () => getRegions(countryId),
    enabled: !!countryId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 12, // 12 hours
    select: (data) => {
      // Sort by is_unmatched (matched items first), then by name
      return data?.sort((a, b) => {
        if (a.is_unmatched !== b.is_unmatched) {
          return a.is_unmatched ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      });
    },
  });
};

export const useCities = (regionId: string) => {
  return useQuery({
    queryKey: ['cities', regionId],
    queryFn: () => getCities(regionId),
    enabled: !!regionId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 12, // 12 hours
    select: (data) => {
      // Sort by is_unmatched (matched items first), then by name
      return data?.sort((a, b) => {
        if (a.is_unmatched !== b.is_unmatched) {
          return a.is_unmatched ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      });
    },
  });
};

// Helper hooks to find specific items by ID
export const useCountryById = (countryId: string) => {
  return useQuery({
    queryKey: ['country', 'by-id', countryId],
    queryFn: () => getCountryById(countryId),
    enabled: !!countryId,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useRegionById = (regionId: string) => {
  return useQuery({
    queryKey: ['region', 'by-id', regionId],
    queryFn: () => getRegionById(regionId),
    enabled: !!regionId,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useCityById = (cityId: string) => {
  return useQuery({
    queryKey: ['city', 'by-id', cityId],
    queryFn: () => getCityById(cityId),
    enabled: !!cityId,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

// Export types
export type { Country, Region, City };
