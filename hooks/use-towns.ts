'use client';

import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { searchTowns, getTownById } from '@/lib/services/location';
import { Town } from '@/types/place';

// Server-side search for towns with debouncing
export const useTownSearch = (query: string) => {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ['towns', 'search', debouncedQuery],
    queryFn: () => searchTowns(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
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
