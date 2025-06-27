import { createClient } from '@/lib/supabase/client';
import { Place, PlaceResults } from '@/types/place';
import { v4 as uuid } from 'uuid';
import slugify from 'slugify';

// Transform PlaceResults to Place for saving to database
function transformPlaceResultsToPlace(
  placeResult: PlaceResults,
  userId: string = 'system'
): Place {
  const place: Place = {
    id: placeResult.id || uuid(),
    name: placeResult.name,
    slug:
      placeResult.slug ||
      slugify(placeResult.name, { lower: true, strict: true }),
    tagline: placeResult.tagline,
    description: placeResult.description,
    contacts: placeResult.contacts,
    email: placeResult.email,
    logo: placeResult.logo,
    main_image: placeResult.main_image,
    gallery: placeResult.gallery,

    country_id: placeResult.country?.id || '',
    region_id: placeResult.region?.id || '',
    city_id: placeResult.city?.id || '',
    location: placeResult.location,

    website: placeResult.website,
    socials: placeResult.socials,

    category_id: placeResult.category?.id || '',
    subcategory_id: placeResult.subcategory?.id || '',
    type_id: placeResult.type?.id || null,
    ownership_id: placeResult.ownership?.id || null,

    open_hours: placeResult.open_hours,
    features: placeResult.features,
    services: placeResult.services,
    tags: placeResult.tags,
    accessibility: placeResult.accessibility,

    rating: placeResult.rating,

    other_details: placeResult.other_details,
    source: placeResult.source,
    source_link: placeResult.source_link,

    added_by: placeResult.added_by || userId || 'anonymous',
    status: placeResult.status || 'pending',
  };

  return place;
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

// Save place to database (client-side)
export async function savePlace(
  placeData: Partial<Place>,
  id?: string,
  userId?: string
): Promise<Place | null> {
  try {
    const supabase = createClient();

    const transformedPlace = transformPlaceResultsToPlace(
      placeData as PlaceResults,
      userId
    );

    if (id) {
      // Update existing place
      const { data, error } = await supabase
        .from('places')
        .update(transformedPlace)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new place
      const { data, error } = await supabase
        .from('places')
        .insert([transformedPlace])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving place:', error);
    return null;
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
