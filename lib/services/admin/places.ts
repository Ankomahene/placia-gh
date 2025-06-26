'use client';

import { createClient } from '@/lib/supabase/client';
import { Place, PlaceResultsSummary } from '@/types/place';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

// Create a new place
export async function createPlace(placeData: Partial<Place>): Promise<Place> {
  const supabase = createClient();
  
  // Generate ID and slug if not provided
  const data = {
    ...placeData,
    id: placeData.id || uuidv4(),
    slug: placeData.slug || slugify(placeData.name || '', { lower: true, strict: true }),
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  const { data: place, error } = await supabase
    .from('places')
    .insert([data])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating place:', error);
    throw new Error(error.message);
  }
  
  return place as Place;
}

// Update an existing place
export async function updatePlace(id: string, placeData: Partial<Place>): Promise<Place> {
  const supabase = createClient();
  
  // Update slug if name is changed
  const data = {
    ...placeData,
    updated_at: new Date(),
  };
  
  if (placeData.name && !placeData.slug) {
    data.slug = slugify(placeData.name, { lower: true, strict: true });
  }
  
  const { data: place, error } = await supabase
    .from('places')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating place:', error);
    throw new Error(error.message);
  }
  
  return place as Place;
}

// Delete a place
export async function deletePlace(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting place:', error);
    throw new Error(error.message);
  }
}

// Get place by ID
export async function getPlaceById(id: string): Promise<Place> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      category:category_id(*),
      subcategory:subcategory_id(*),
      type:type_id(*),
      ownership:ownership_id(*),
      country:country_id(*),
      region:region_id(*),
      city:city_id(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error getting place:', error);
    throw new Error(error.message);
  }
  
  return data as Place;
}

// Get places with pagination and filters
export async function getPlaces(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  data: PlaceResultsSummary[];
  count: number;
}> {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    status,
    category,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  const supabase = createClient();
  
  // Start building the query
  let query = supabase
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
      `,
      { count: 'exact' }
    );

  // Apply filters
  if (search) {
    query = query.textSearch('search_vector', search, {
      type: 'websearch',
      config: 'english',
    });
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (category) {
    query = query.eq('category_id', category);
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  
  // Execute the query with pagination
  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching places:', error);
    throw new Error(error.message);
  }

  return { 
    data: data as PlaceResultsSummary[], 
    count: count || 0 
  };
}

// Update place status
export async function updatePlaceStatus(id: string, status: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('places')
    .update({ status, updated_at: new Date() })
    .eq('id', id);
  
  if (error) {
    console.error('Error updating place status:', error);
    throw new Error(error.message);
  }
}

// Import places from CSV
export async function importPlacesFromCsv(csvData: string): Promise<Place[]> {
  // Implementation would depend on your CSV parsing library
  // This is a placeholder
  return [];
}

// Import places from JSON
export async function importPlacesFromJson(jsonData: string): Promise<Place[]> {
  try {
    const places = JSON.parse(jsonData);
    const placesArray = Array.isArray(places) ? places : [places];
    
    // Validate and process each place
    const processedPlaces = placesArray.map(place => ({
      ...place,
      id: place.id || uuidv4(),
      slug: place.slug || slugify(place.name || '', { lower: true, strict: true }),
      created_at: place.created_at || new Date(),
      updated_at: new Date(),
    }));
    
    return processedPlaces as Place[];
  } catch (error) {
    console.error('Error importing places from JSON:', error);
    throw error;
  }
}