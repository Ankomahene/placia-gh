'use client';

import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { getTowns, searchTowns, getTownById } from '@/lib/services/location';
import { Town } from '@/types/place';

// Get towns by city ID
export const useTowns = (cityId: string) => {
  return useQuery({
    queryKey: ['towns', cityId],
    queryFn: () => getTowns(cityId),
    enabled: !!cityId,
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

// Server-side search for towns with debouncing
export const useTownSearch = (query: string) => {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ['towns', 'search', debouncedQuery],
    queryFn: () => searchTowns(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
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

// Get town by ID
export const useTownById = (townId: string) => {
  return useQuery({
    queryKey: ['town', 'by-id', townId],
    queryFn: () => getTownById(townId),
    enabled: !!townId,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

// Export types
export type { Town };
