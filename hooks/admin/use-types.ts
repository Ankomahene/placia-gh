'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PlaceType } from '@/types/place';

// Fetch types by subcategory ID
async function fetchTypes(subcategoryId?: string): Promise<PlaceType[]> {
  if (!subcategoryId) return [];
  
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('types')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .order('name');
  
  if (error) {
    console.error('Error fetching types:', error);
    throw new Error(error.message);
  }
  
  return data as PlaceType[];
}

export function useTypes(subcategoryId?: string) {
  return useQuery({
    queryKey: ['types', subcategoryId],
    queryFn: () => fetchTypes(subcategoryId),
    enabled: !!subcategoryId,
  });
}