import { useQuery } from '@tanstack/react-query';
import { Place } from '@/types/place';

// API function to fetch featured places
async function fetchFeaturedPlaces(): Promise<Place[]> {
  const response = await fetch('/api/places/featured');

  if (!response.ok) {
    throw new Error('Failed to fetch featured places');
  }

  return response.json();
}

export function useFeaturedPlaces() {
  return useQuery({
    queryKey: ['featured-places'],
    queryFn: fetchFeaturedPlaces,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (cache time)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
