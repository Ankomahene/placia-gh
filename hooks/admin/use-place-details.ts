'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlaceDetails } from '@/lib/services/client/places';

export function usePlaceDetails(id: string) {
  return useQuery({
    queryKey: ['place', id],
    queryFn: () => getPlaceDetails(id),
    enabled: !!id,
  });
}
