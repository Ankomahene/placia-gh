import { createClient } from '@/lib/supabase/client';
import { Place, PlaceResults } from '@/types/place';
import { v4 as uuid } from 'uuid';
import slugify from 'slugify';

// Transform PlaceResults or Place to Place for saving to database
function transformPlaceResultsToPlace(
  placeData: PlaceResults | Partial<Place>,
  userId: string = 'system'
): Partial<Place> {
  // Helper function to safely get ID from either format (always return string)
  const getIdValue = (
    directId: string | number | null | undefined,
    nestedObj: { id?: string | number } | null | undefined
  ): string => {
    // Handle direct ID (string or number)
    if (directId !== null && directId !== undefined && directId !== '') {
      return String(directId);
    }
    // Handle nested object ID
    if (
      nestedObj?.id !== null &&
      nestedObj?.id !== undefined &&
      nestedObj?.id !== ''
    ) {
      return String(nestedObj.id);
    }
    return '';
  };

  // Helper function to handle optional UUID fields (return undefined instead of empty string)
  const getOptionalUuidValue = (
    directId: string | number | null | undefined,
    nestedObj: { id?: string | number } | null | undefined
  ): string | undefined => {
    const value = getIdValue(directId, nestedObj);
    return value === '' ? undefined : value;
  };

  const place: Partial<Place> = {
    // Generate ID if not provided (Supabase will auto-generate if not specified)
    ...(placeData.id && placeData.id !== '' ? { id: placeData.id } : {}),

    name: placeData.name || '',
    slug:
      placeData.slug ||
      slugify(placeData.name || '', { lower: true, strict: true }),
    tagline: placeData.tagline,
    description: placeData.description || '',
    contacts: placeData.contacts || [],
    email: placeData.email,
    logo: placeData.logo,
    main_image: placeData.main_image,
    gallery: placeData.gallery || [],

    // Handle location fields as strings (convert to numbers only when saving to DB)
    country_id:
      getIdValue(
        (placeData as Partial<Place>).country_id,
        (placeData as PlaceResults).country
      ) || '',
    region_id:
      getIdValue(
        (placeData as Partial<Place>).region_id,
        (placeData as PlaceResults).region
      ) || '',
    city_id:
      getIdValue(
        (placeData as Partial<Place>).city_id,
        (placeData as PlaceResults).city
      ) || '',
    town_id: getOptionalUuidValue(
      (placeData as Partial<Place>).town_id,
      undefined
    ),
    location: placeData.location || {
      lat: 0,
      lng: 0,
      name: '',
      street_address: '',
    },

    website: placeData.website,
    socials: placeData.socials || [],

    // Handle UUID foreign key fields as strings
    category_id:
      getIdValue(
        (placeData as Partial<Place>).category_id,
        (placeData as PlaceResults).category
      ) || '',
    subcategory_id:
      getIdValue(
        (placeData as Partial<Place>).subcategory_id,
        (placeData as PlaceResults).subcategory
      ) || '',

    // Optional UUID fields - use undefined instead of empty string
    type_id: getOptionalUuidValue(
      (placeData as Partial<Place>).type_id,
      (placeData as PlaceResults).type
    ),
    ownership_id: getOptionalUuidValue(
      (placeData as Partial<Place>).ownership_id,
      (placeData as PlaceResults).ownership
    ),

    open_hours: placeData.open_hours || [],
    features: placeData.features || [],
    services: placeData.services || [],
    tags: placeData.tags || [],
    accessibility: placeData.accessibility || [],

    rating: placeData.rating,

    other_details: placeData.other_details,
    source: placeData.source,
    source_link: placeData.source_link,

    added_by: placeData.added_by || userId || 'anonymous',
    status: placeData.status || 'pending',
    isBusinessPlace: (placeData as Partial<Place>).isBusinessPlace || false,
    isFeatured: (placeData as Partial<Place>).isFeatured || false,
  };

  return place;
}

// Batch save result interface
export interface BatchSaveResult {
  successful: Place[];
  failed: { place: Partial<Place>; error: string }[];
  successCount: number;
  errorCount: number;
}

// Get place details for client-side operations
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceResults | null> {
  try {
    const supabase = createClient();

    const { data: place, error } = await supabase
      .from('places')
      .select(
        `
        *,
        category:category_id(id, name, slug, icon),
        subcategory:subcategory_id(id, name, slug, icon),
        type:type_id(id, name, slug, icon),
        ownership:ownership_id(id, type, slug, icon),
        country:country_id(id, name),
        region:region_id(id, name),
        city:city_id(id, name)
      `
      )
      .eq('id', placeId)
      .single();

    if (error || !place) {
      console.error('Error fetching place details:', error);
      return null;
    }

    // Transform to PlaceResults format
    const result: PlaceResults = {
      id: place.id,
      name: place.name,
      slug: place.slug,
      tagline: place.tagline,
      description: place.description,
      contacts: place.contacts,
      email: place.email,
      logo: place.logo,
      main_image: place.main_image || place.gallery?.[0] || '',
      gallery: place.gallery || [],

      country: place.country,
      region: place.region,
      city: place.city,
      location: place.location,

      website: place.website,
      socials: place.socials,

      category: place.category,
      subcategory: place.subcategory,
      type: place.type,
      ownership: place.ownership,

      rating: place.rating,
      open_hours: place.open_hours,
      features: place.features || [],
      services: place.services || [],
      tags: place.tags,
      accessibility: place.accessibility || [],

      created_at: new Date(place.created_at),
      updated_at: new Date(place.updated_at),

      other_details: place.other_details,
      source: place.source,
      source_link: place.source_link,

      added_by: place.added_by,
      status: place.status,
      isBusinessPlace: place.isBusinessPlace,
    };

    return result;
  } catch (error) {
    console.error('Error in getPlaceDetails:', error);
    return null;
  }
}

// Function overloads for savePlace
export async function savePlace(
  placeData: Partial<Place>,
  userId?: string
): Promise<Place | null>;

export async function savePlace(
  placesData: Partial<Place>[],
  userId?: string
): Promise<BatchSaveResult>;

// Save place(s) to database (client-side) - supports both single and batch operations
export async function savePlace(
  placeDataOrArray: Partial<Place> | Partial<Place>[],
  userId?: string
): Promise<Place | null | BatchSaveResult> {
  // Handle array input (batch save)
  if (Array.isArray(placeDataOrArray)) {
    return await savePlacesBatch(placeDataOrArray, userId);
  }

  // Handle single place input
  const placeData = placeDataOrArray as Partial<Place>;
  const actualUserId = userId || 'admin';

  try {
    const supabase = createClient();

    const transformedPlace = transformPlaceResultsToPlace(
      placeData as PlaceResults,
      actualUserId
    );

    // Always generate new ID to avoid conflicts
    transformedPlace.id = uuid();

    const { data, error } = await supabase
      .from('places')
      .insert([transformedPlace])
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', error);
      console.error('❌ Insert error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    return data;
  } catch (error) {
    console.error('💥 Error saving place:', error);
    console.error('💥 Full error object:', error);
    return null;
  }
}

// Batch save places with improved performance and error handling
export async function savePlacesBatch(
  placesData: Partial<Place>[],
  userId?: string
): Promise<BatchSaveResult> {
  const result: BatchSaveResult = {
    successful: [],
    failed: [],
    successCount: 0,
    errorCount: 0,
  };

  if (placesData.length === 0) {
    return result;
  }

  try {
    const supabase = createClient();

    // Transform all places and generate UUIDs
    const transformedPlaces = placesData.map((placeData) => {
      const transformed = transformPlaceResultsToPlace(
        placeData as PlaceResults,
        userId
      );

      // Always generate new UUID for import
      transformed.id = uuid();

      return transformed;
    });

    // Batch insert new places
    if (transformedPlaces.length > 0) {
      try {
        const { data: insertedPlaces, error: insertError } = await supabase
          .from('places')
          .insert(transformedPlaces)
          .select();

        if (insertError) {
          // Handle partial success - some might have failed
          console.error('❌ Batch insert error:', insertError);
          console.error('❌ Batch insert error details:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          });
          transformedPlaces.forEach((place) => {
            result.failed.push({ place, error: insertError.message });
            result.errorCount++;
          });
        } else if (insertedPlaces) {
          result.successful.push(...insertedPlaces);
          result.successCount += insertedPlaces.length;
        }
      } catch (insertError) {
        console.error('Batch insert error:', insertError);
        transformedPlaces.forEach((place) => {
          result.failed.push({
            place,
            error:
              insertError instanceof Error
                ? insertError.message
                : 'Insert failed',
          });
          result.errorCount++;
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error in batch save:', error);

    // If there's a general error, mark all places as failed
    placesData.forEach((place) => {
      result.failed.push({
        place,
        error: error instanceof Error ? error.message : 'Batch save failed',
      });
      result.errorCount++;
    });

    return result;
  }
}

// Save PlaceResults directly to database (client-side)
export async function savePlaceResults(
  placeResult: PlaceResults,
  userId?: string
): Promise<Place | null> {
  try {
    const transformedPlace = transformPlaceResultsToPlace(placeResult, userId);
    const supabase = createClient();

    // Check if place already exists
    if (transformedPlace.id) {
      const { data: existingPlace } = await supabase
        .from('places')
        .select('id')
        .eq('id', transformedPlace.id)
        .single();

      if (existingPlace) {
        // Update existing place
        const { data, error } = await supabase
          .from('places')
          .update(transformedPlace)
          .eq('id', transformedPlace.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }

    // Insert new place
    const { data, error } = await supabase
      .from('places')
      .insert([transformedPlace])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving place from PlaceResults:', error);
    return null;
  }
}

// Get user's businesses with pagination and filters
export async function getUserBusinesses(params: {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  data: PlaceResults[];
  count: number;
}> {
  const {
    userId,
    page = 1,
    pageSize = 10,
    search = '',
    status,
    category,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  try {
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
      )
      .eq('added_by', userId)
      .eq('isBusinessPlace', true);

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,tagline.ilike.%${search}%`
      );
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
      console.error('Error fetching user businesses:', error);
      throw new Error(error.message);
    }

    // Transform the data to PlaceResults format
    const transformedData: PlaceResults[] = (data || []).map((place: any) => ({
      id: place.id,
      name: place.name,
      slug: place.slug,
      tagline: place.tagline,
      description: place.description,
      contacts: place.contacts,
      email: place.email,
      logo: place.logo,
      main_image: place.main_image || place.gallery?.[0] || '',
      gallery: place.gallery || [],

      country: place.country,
      region: place.region,
      city: place.city,
      location: place.location,

      website: place.website,
      socials: place.socials,

      category: place.category,
      subcategory: place.subcategory,
      type: place.type,
      ownership: place.ownership,

      rating: place.rating,
      open_hours: place.open_hours,
      features: place.features || [],
      services: place.services || [],
      tags: place.tags,
      accessibility: place.accessibility || [],

      created_at: new Date(place.created_at),
      updated_at: new Date(place.updated_at),

      other_details: place.other_details,
      source: place.source,
      source_link: place.source_link,

      added_by: place.added_by,
      status: place.status,
      isBusinessPlace: place.isBusinessPlace,
    }));

    return {
      data: transformedData,
      count: count || 0,
    };
  } catch (error) {
    console.error('Error in getUserBusinesses:', error);
    throw error;
  }
}

// Delete a user's business place
export async function deleteUserBusiness(
  placeId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    // First verify this place belongs to the user and is a business
    const { data: place, error: fetchError } = await supabase
      .from('places')
      .select('added_by, isBusinessPlace')
      .eq('id', placeId)
      .single();

    if (fetchError) {
      console.error('Error fetching place for deletion:', fetchError);
      throw new Error('Place not found');
    }

    if (place.added_by !== userId || !place.isBusinessPlace) {
      throw new Error('Unauthorized to delete this place');
    }

    // Delete the place
    const { error: deleteError } = await supabase
      .from('places')
      .delete()
      .eq('id', placeId)
      .eq('added_by', userId);

    if (deleteError) {
      console.error('Error deleting place:', deleteError);
      throw new Error('Failed to delete place');
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUserBusiness:', error);
    throw error;
  }
}

// Get user contributed places (non-business places)
export async function getUserContributedPlaces(params: {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  data: PlaceResults[];
  count: number;
}> {
  try {
    const supabase = createClient();
    const {
      userId,
      page = 1,
      pageSize = 10,
      search,
      status,
      category,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    let query = supabase
      .from('places')
      .select(
        `
        *,
        category:category_id(id, name, slug, icon),
        subcategory:subcategory_id(id, name, slug, icon),
        type:type_id(id, name, slug, icon),
        ownership:ownership_id(id, type, slug, icon),
        country:country_id(id, name),
        region:region_id(id, name),
        city:city_id(id, name)
      `,
        { count: 'exact' }
      )
      .eq('added_by', userId)
      .eq('isBusinessPlace', false); // Filter for non-business places

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,tagline.ilike.%${search}%`
      );
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: places, error, count } = await query;

    if (error) {
      console.error('Error fetching user contributed places:', error);
      throw error;
    }

    // Transform to PlaceResults format
    const transformedPlaces: PlaceResults[] = (places || []).map((place) => ({
      id: place.id,
      name: place.name,
      slug: place.slug,
      tagline: place.tagline,
      description: place.description,
      contacts: place.contacts,
      email: place.email,
      logo: place.logo,
      main_image: place.main_image || place.gallery?.[0] || '',
      gallery: place.gallery || [],

      country: place.country,
      region: place.region,
      city: place.city,
      location: place.location,

      website: place.website,
      socials: place.socials,

      category: place.category,
      subcategory: place.subcategory,
      type: place.type,
      ownership: place.ownership,

      rating: place.rating,
      status: place.status,
      open_hours: place.open_hours,
      features: place.features || [],
      services: place.services || [],
      tags: place.tags,
      accessibility: place.accessibility || [],

      created_at: new Date(place.created_at),
      updated_at: new Date(place.updated_at),
    }));

    return {
      data: transformedPlaces,
      count: count || 0,
    };
  } catch (error) {
    console.error('Error in getUserContributedPlaces:', error);
    throw error;
  }
}

// Delete user contributed place
export async function deleteUserContributedPlace(
  placeId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    // First verify this place belongs to the user and is NOT a business
    const { data: place, error: fetchError } = await supabase
      .from('places')
      .select('added_by, isBusinessPlace')
      .eq('id', placeId)
      .single();

    if (fetchError) {
      console.error('Error fetching place for deletion:', fetchError);
      throw new Error('Place not found');
    }

    if (place.added_by !== userId || place.isBusinessPlace) {
      throw new Error('Unauthorized to delete this place');
    }

    // Delete the place
    const { error: deleteError } = await supabase
      .from('places')
      .delete()
      .eq('id', placeId)
      .eq('added_by', userId);

    if (deleteError) {
      console.error('Error deleting place:', deleteError);
      throw new Error('Failed to delete place');
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUserContributedPlace:', error);
    throw error;
  }
}

// Get user reviews count
export async function getUserReviewsCount(userId: string): Promise<number> {
  try {
    const supabase = createClient();

    const { count, error } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user reviews count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUserReviewsCount:', error);
    throw error;
  }
}

// Get user uploaded photos count
export async function getUserPhotosCount(userId: string): Promise<number> {
  try {
    const supabase = createClient();

    const { count, error } = await supabase
      .from('user_uploaded_photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user photos count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUserPhotosCount:', error);
    throw error;
  }
}
