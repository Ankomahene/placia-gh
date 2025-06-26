'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PlaceSubcategory } from '@/types/place';

// Fetch subcategories by category ID
async function fetchSubcategories(categoryId?: string): Promise<PlaceSubcategory[]> {
  if (!categoryId) return [];
  
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .order('name');
  
  if (error) {
    console.error('Error fetching subcategories:', error);
    throw new Error(error.message);
  }
  
  return data as PlaceSubcategory[];
}

export function useSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: () => fetchSubcategories(categoryId),
    enabled: !!categoryId,
  });
}