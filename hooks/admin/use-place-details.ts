'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Place } from '@/types/place';

// Fetch place details by ID
async function fetchPlaceDetails(id: string): Promise<Place> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('places')
    .select(
      `
        *,
        category:category_id(id, name, slug, icon),
        subcategory:subcategory_id(id, name, slug, icon),
        type:type_id(id, name, slug, icon),
        ownership:ownership_id(id, type, slug, icon),
        country:country_id(id, name, emoji),
        region:region_id(id, name),
        city:city_id(id, name)
      `
    )
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching place details:', error);
    throw new Error(error.message);
  }
  
  return data as Place;
}

export function usePlaceDetails(id: string) {
  return useQuery({
    queryKey: ['place', id],
    queryFn: () => fetchPlaceDetails(id),
    enabled: !!id,
  });
}