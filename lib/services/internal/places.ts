import { rankAndSortPlaces } from '@/lib/services/places-ranking';
import { createClient } from '@/lib/supabase/server';
import { cleanAndSplitString } from '@/lib/utils/string';
import { PlaceResults } from '@/types/place';
import { StructuredSearchQuery } from '@/types/search';
import { getSafeImageGallery, isPlaceOpenNow } from './utils';
import { calculateDistance } from '@/lib/utils';
import { geocodeLocation } from '../google/places';
import { reverseGeocode } from '../location-matching';

async function getCategoriesAndSubcategories(
  category?: string,
  subcategory?: string
): Promise<{ categories: any[]; subcategories: any[] }> {
  if (!category && !subcategory) {
    return { categories: [], subcategories: [] };
  }

  const supabase = await createClient();

  // Create search terms array to handle both category and subcategory
  const searchTerms: string[] = [];
  if (category) searchTerms.push(...cleanAndSplitString(category));
  if (subcategory) searchTerms.push(...cleanAndSplitString(subcategory));

  // Build a more comprehensive OR condition for better matching
  const orConditions = searchTerms
    .map((term) => `name.ilike.%${term}%,description.ilike.%${term}%`)
    .join(',');

  const [categoriesResult, subcategoriesResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, description')
      .or(orConditions),

    supabase
      .from('subcategories')
      .select('id, name, slug, description')
      .or(orConditions),
  ]);

  if (categoriesResult.error || subcategoriesResult.error) {
    throw new Error(
      categoriesResult.error?.message ||
        subcategoriesResult.error?.message ||
        'Failed to get categories or subcategories'
    );
  }

  return {
    categories: categoriesResult.data,
    subcategories: subcategoriesResult.data,
  };
}

export async function searchInternalPlaces(
  structuredQuery: StructuredSearchQuery
): Promise<PlaceResults[]> {
  try {
    const supabase = await createClient();

    console.log('structuredQuery', structuredQuery);

    const {
      query,
      location,
      category,
      subcategory,
      features,
      type,
      min_rating,
      radius_meters,
      open_now,
      user_location,
    } = structuredQuery;

    // get all categories and subcategories from the database matching the query
    const { categories, subcategories } = await getCategoriesAndSubcategories(
      category,
      subcategory
    );

    const categoryIds = categories.map((category) => category.id);
    const subcategoryIds = subcategories.map((subcategory) => subcategory.id);

    // Start building the query - get comprehensive data
    let supabaseQuery = supabase
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
      .in('status', ['approved', 'scraped'])
      .or(
        `category_id.in.(${categoryIds.join(',')}),subcategory_id.in.(${subcategoryIds.join(',')})`
      );

    // Execute the query first to get all approved places
    const { data: allPlaces, error } = await supabaseQuery
      .limit(200) // Increased limit for better search coverage
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching internal places:', error);
      throw new Error('Failed to search internal places');
    }

    if (!allPlaces || allPlaces.length === 0) {
      return [];
    }
    let requestedLocation = null;

    if (location) {
      requestedLocation = await geocodeLocation(location);
    }

    // Transform to PlaceResults format
    const results = allPlaces.map((place: any) => {
      const openStatus = open_now
        ? isPlaceOpenNow(place.open_hours)
        : undefined;

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
        gallery: getSafeImageGallery(place.gallery, place.main_image) || [],

        country: place.country,
        region: place.region,
        city: place.city,
        location: {
          lat: place.location?.lat,
          lng: place.location?.lng,
          name: place.location?.name,
          street_address: place.location?.street_address,
        },

        website: place.website,
        socials: place.socials,

        category: place.category,
        subcategory: place.subcategory,
        type: place.types || null,
        ownership: place.ownerships || null,

        rating: place.rating,
        open_hours: place.open_hours,
        open_now: openStatus,
        features: place.features || [],
        services: place.services || [],
        tags: place.tags,
        accessibility: place.accessibility || [],

        created_at: new Date(place.created_at || Date.now()),
        updated_at: new Date(place.updated_at || Date.now()),

        other_details: place.other_details,
        source: place.source,
        source_link: place.source_link,

        added_by: place.added_by || 'anonymous',
        status: place.status,
      };

      if (user_location) {
        result.distance = calculateDistance(
          user_location.lat,
          user_location.lng,
          place.location.lat,
          place.location.lng,
          'm'
        );
      }

      if (!user_location && requestedLocation && radius_meters) {
        result.distance = calculateDistance(
          requestedLocation.lat,
          requestedLocation.lng,
          place.location.lat,
          place.location.lng,
          'm'
        );
      }

      return result;
    });

    let placesResults = results;

    if (location && requestedLocation) {
      const queryLocation = location.toLowerCase();

      const reversedGeocode = await reverseGeocode(
        requestedLocation.lat,
        requestedLocation.lng
      );

      placesResults = placesResults.filter((place) => {
        const cityMatch = place.city?.name?.toLowerCase() === queryLocation;
        const regionMatch = place.region?.name?.toLowerCase() === queryLocation;
        const countryMatch =
          place.country?.name?.toLowerCase() === queryLocation;
        const locationNameMatch = place.location?.name
          ?.toLowerCase()
          ?.includes(queryLocation);
        const addressMatch = place.location?.street_address
          ?.toLowerCase()
          ?.includes(queryLocation);
        const parentCityMatch = reversedGeocode?.city
          ? place.city?.name?.toLowerCase() ===
              reversedGeocode?.city?.toLowerCase() ||
            place.location?.name?.includes(reversedGeocode?.city?.toLowerCase())
          : false;

        const parentRegionMatch = reversedGeocode?.region
          ? place.region?.name?.toLowerCase() ===
              reversedGeocode?.region?.toLowerCase() ||
            place.location?.name
              ?.toLowerCase()
              .includes(reversedGeocode?.region?.toLowerCase())
          : false;

        return (
          cityMatch ||
          regionMatch ||
          countryMatch ||
          locationNameMatch ||
          addressMatch ||
          parentCityMatch ||
          parentRegionMatch
        );
      });
    }

    // Filter by radius ONLY if location is provided AND we have distance calculations
    if (radius_meters && (user_location || requestedLocation)) {
      placesResults = placesResults.filter((result) => {
        if (!result.location) return false;
        return result.distance && result.distance <= radius_meters;
      });

      //sort from closest to farthest
      placesResults = placesResults.sort((a, b) => {
        const aDistance = a.distance || 0;
        const bDistance = b.distance || 0;
        return aDistance - bDistance;
      });
    }

    // Sort by minimum rating
    if (min_rating && min_rating > 0) {
      // sort from highest to lowest rating
      placesResults = placesResults.sort((a, b) => {
        const aRating = a.rating?.rate || 0;
        const bRating = b.rating?.rate || 0;
        return bRating - aRating;
      });
    }

    // Filter by open now if requested
    if (open_now) {
      //sort by open now first
      placesResults = placesResults.sort((a, b) => {
        const aOpen = a.open_now || false;
        const bOpen = b.open_now || false;
        return aOpen ? -1 : 1;
      });
    }
    // Use ranking system to sort results
    const rankedPlaces = rankAndSortPlaces(structuredQuery, placesResults);

    return rankedPlaces;
  } catch (error) {
    console.error('Error searching internal places:', error);
    throw new Error('Failed to search internal places');
  }
}

export async function getInternalPlaceDetails(
  placeId: string
): Promise<PlaceResults | null> {
  try {
    const supabase = await createClient();

    const { data: place, error } = await supabase
      .from('places')
      .select(
        `
        *,
        category:category_id(name, slug, icon),
        subcategory:subcategory_id(name, slug, icon),
        type:type_id(name, slug, icon),
        ownership:ownership_id(type, slug, icon),
        country:country_id(name, emoji),
        region:region_id(name),
        city:city_id(name)
      `
      )
      .eq('id', placeId)
      .single();

    if (error) {
      console.error('Error getting internal place details:', error);
      return null;
    }

    return place as PlaceResults;
  } catch (error) {
    console.error('Error getting internal place details:', error);
    return null;
  }
}
