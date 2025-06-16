import { Client } from '@googlemaps/google-maps-services-js';
import {
  StructuredSearchQuery,
  GooglePlaceSearchResult,
  GooglePlaceDetails,
  GoogleGeocodingResult,
  FormattedGooglePlaceSearchResult,
} from '@/types/search';
import { PlaceResults, PlaceCategory, PlaceSubcategory } from '@/types/place';
import slugify from 'slugify';

const client = new Client({});
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}

export async function nearbySearch(
  location: { lat: number; lng: number },
  structuredQuery: StructuredSearchQuery
): Promise<GooglePlaceSearchResult[]> {
  try {
    const {
      query,
      radius_meters = 5000,
      min_rating,
      open_now,
    } = structuredQuery;

    const searchParams: any = {
      key: GOOGLE_API_KEY,
      location: `${location.lat},${location.lng}`,
      radius: radius_meters,
      keyword: query,
      type: 'establishment',
    };

    if (min_rating) {
      searchParams.minprice = 0;
      searchParams.maxprice = 4;
    }

    if (open_now) {
      searchParams.opennow = true;
    }

    const response = await client.placesNearby({
      params: searchParams,
    });

    const results = response.data.results || [];

    // Filter by minimum rating if specified
    const filteredResults = min_rating
      ? results.filter((place) => (place.rating || 0) >= min_rating)
      : results;

    return filteredResults.map((place) => ({
      place_id: place.place_id!,
      name: place.name!,
      geometry: {
        location: {
          lat: place.geometry!.location!.lat,
          lng: place.geometry!.location!.lng,
        },
      },
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      photos: place.photos?.map((photo) => ({
        photo_reference: photo.photo_reference,
        height: photo.height,
        width: photo.width,
      })),
      types: place.types || [],
      vicinity: place.vicinity,
    }));
  } catch (error) {
    console.error('Error in nearby search:', error);
    throw new Error('Failed to perform nearby search');
  }
}

export async function getPlaceDetails(
  placeId: string
): Promise<GooglePlaceDetails> {
  try {
    const response = await client.placeDetails({
      params: {
        key: GOOGLE_API_KEY,
        place_id: placeId,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'formatted_phone_number',
          'website',
          'rating',
          'user_ratings_total',
          'price_level',
          'geometry',
          'photos',
          'reviews',
          'types',
          'opening_hours',
          'url',
        ],
      },
    });

    const place = response.data.result;
    if (!place) {
      throw new Error('Place not found');
    }

    return {
      place_id: place.place_id!,
      name: place.name!,
      formatted_address: place.formatted_address!,
      formatted_phone_number: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      geometry: {
        location: {
          lat: place.geometry!.location!.lat,
          lng: place.geometry!.location!.lng,
        },
      },
      photos: place.photos?.map((photo) => ({
        photo_reference: photo.photo_reference,
        height: photo.height,
        width: photo.width,
      })),
      reviews: place.reviews?.map((review) => ({
        text: review.text,
        rating: review.rating,
        author_name: review.author_name,
        time:
          typeof review.time === 'string' ? parseInt(review.time) : review.time,
      })),
      types: place.types || [],
      opening_hours: place.opening_hours
        ? {
            open_now: place.opening_hours.open_now || false,
            weekday_text: place.opening_hours.weekday_text || [],
          }
        : undefined,
      url: place.url,
    };
  } catch (error) {
    console.error('Error getting place details:', error);
    throw new Error('Failed to get place details');
  }
}

export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number }> {
  try {
    const response = await client.geocode({
      params: {
        key: GOOGLE_API_KEY,
        address: location,
      },
    });

    const results = response.data.results;
    if (!results || results.length === 0) {
      throw new Error('Location not found');
    }

    const firstResult = results[0];
    return {
      lat: firstResult.geometry.location.lat,
      lng: firstResult.geometry.location.lng,
    };
  } catch (error) {
    console.error('Error geocoding location:', error);
    throw new Error('Failed to geocode location');
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GoogleGeocodingResult[]> {
  try {
    const response = await client.reverseGeocode({
      params: {
        key: GOOGLE_API_KEY,
        latlng: `${lat},${lng}`,
      },
    });

    return response.data.results.map((result) => ({
      address_components: result.address_components.map((component) => ({
        long_name: component.long_name,
        short_name: component.short_name,
        types: component.types,
      })),
      formatted_address: result.formatted_address,
      geometry: {
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
      },
      place_id: result.place_id,
      types: result.types,
    }));
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw new Error('Failed to reverse geocode');
  }
}

export async function searchGooglePlaces(
  structuredQuery: StructuredSearchQuery
): Promise<PlaceResults[]> {
  try {
    const {
      query,
      location,
      region,
      radius_meters,
      min_price,
      max_price,
      open_now,
      category,
      language,
      user_location,
    } = structuredQuery;

    const searchParams: any = {
      key: GOOGLE_API_KEY,
      query: query,
    };

    // Add location if provided (can be coordinates or place name)
    if (location) {
      // Check if location is coordinates (lat,lng format)
      if (
        location.includes(',') &&
        !isNaN(parseFloat(location.split(',')[0]))
      ) {
        searchParams.location = location;
        if (radius_meters) {
          searchParams.radius = Math.min(radius_meters, 50000); // Max 50km for textSearch
        }
      } else {
        // It's a place name, geocode it first
        try {
          const coords = await geocodeLocation(location);
          searchParams.location = `${coords.lat},${coords.lng}`;
          if (radius_meters) {
            searchParams.radius = Math.min(radius_meters, 50000);
          }
        } catch (error) {
          console.warn(
            'Could not geocode location, proceeding without location filter'
          );
        }
      }
    }

    if (user_location) {
      searchParams.location = `${user_location.lat},${user_location.lng}`;
      searchParams.radius = 1000;
    }

    // Add region if provided
    if (region) {
      searchParams.region = region;
    }

    // Add price range if provided (Google uses 0-4 scale)
    if (min_price !== undefined) {
      searchParams.minprice = Math.max(0, Math.min(4, min_price));
    }
    if (max_price !== undefined) {
      searchParams.maxprice = Math.max(0, Math.min(4, max_price));
    }

    // Add open now filter
    if (open_now) {
      searchParams.opennow = true;
    }

    // Add place type if provided
    if (category) {
      searchParams.type = category;
    }

    // Add language if provided
    if (language) {
      searchParams.language = language;
    }

    const response = await client.textSearch({
      params: searchParams,
    });

    const results = response.data.results || [];

    // Transform to FormattedGooglePlaceSearchResult format
    const formattedResults: FormattedGooglePlaceSearchResult[] = results
      .filter(
        (place) => place.place_id && place.name && place.geometry?.location
      )
      .map((place) => {
        const gallery = place.photos?.map((photo) =>
          getGooglePhotoUrl(photo.photo_reference, 800)
        );

        return {
          placeId: place.place_id!,
          name: place.name!,
          location: {
            lat: place.geometry!.location!.lat,
            lng: place.geometry!.location!.lng,
          },
          rating: place.rating,
          totalReviews: place.user_ratings_total,
          priceLevel: place.price_level,
          types: place.types || [],
          vicinity: place.vicinity,
          formattedAddress: place.formatted_address,
          openNow: place.opening_hours?.open_now,
          gallery: gallery || [],
        };
      });

    // Transform to PlaceResults format
    return transformGooglePlacesToPlaceResults(formattedResults);
  } catch (error) {
    console.error('Error in Google textSearch:', error);
    throw new Error('Failed to search places with Google textSearch');
  }
}

export function getGooglePhotoUrl(
  photoReference: string,
  maxWidth: number = 400
): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

/**
 * Maps Google place types to category and subcategory
 */
function mapGoogleTypesToCategories(types: string[] = []): {
  category: Omit<PlaceCategory, 'created_at' | 'updated_at'>;
  subcategory: Omit<PlaceSubcategory, 'created_at' | 'updated_at'>;
} {
  // Filter out generic types
  const specificTypes = types.filter(
    (type) => !['establishment', 'point_of_interest', 'premise'].includes(type)
  );

  const primaryType = specificTypes[0] || types[0] || 'place';
  const secondaryType = specificTypes[1];

  // Create human-readable names
  const formatTypeName = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Category mapping for better organization
  const categoryMappings: { [key: string]: { name: string; icon: string } } = {
    restaurant: { name: 'Restaurants & Food', icon: 'utensils' },
    food: { name: 'Restaurants & Food', icon: 'utensils' },
    meal_takeaway: { name: 'Restaurants & Food', icon: 'utensils' },
    cafe: { name: 'Restaurants & Food', icon: 'coffee' },
    bar: { name: 'Restaurants & Food', icon: 'wine' },

    lodging: { name: 'Accommodation', icon: 'bed' },

    hospital: { name: 'Healthcare', icon: 'heart-pulse' },
    pharmacy: { name: 'Healthcare', icon: 'pill' },
    dentist: { name: 'Healthcare', icon: 'tooth' },
    doctor: { name: 'Healthcare', icon: 'stethoscope' },

    gas_station: { name: 'Transportation', icon: 'fuel' },
    subway_station: { name: 'Transportation', icon: 'train' },
    bus_station: { name: 'Transportation', icon: 'bus' },
    airport: { name: 'Transportation', icon: 'plane' },

    bank: { name: 'Financial Services', icon: 'building-2' },
    atm: { name: 'Financial Services', icon: 'credit-card' },

    shopping_mall: { name: 'Shopping', icon: 'shopping-bag' },
    store: { name: 'Shopping', icon: 'store' },
    supermarket: { name: 'Shopping', icon: 'shopping-cart' },

    school: { name: 'Education', icon: 'graduation-cap' },
    university: { name: 'Education', icon: 'book-open' },

    gym: { name: 'Health & Fitness', icon: 'dumbbell' },
    spa: { name: 'Health & Fitness', icon: 'heart' },

    church: { name: 'Places of Worship', icon: 'church' },
    mosque: { name: 'Places of Worship', icon: 'moon' },

    tourist_attraction: { name: 'Entertainment & Attractions', icon: 'camera' },
    amusement_park: {
      name: 'Entertainment & Attractions',
      icon: 'ferris-wheel',
    },
    museum: { name: 'Entertainment & Attractions', icon: 'landmark' },

    police: { name: 'Government & Public Services', icon: 'shield' },
    fire_station: { name: 'Government & Public Services', icon: 'flame' },
    post_office: { name: 'Government & Public Services', icon: 'mail' },
  };

  const categoryInfo = categoryMappings[primaryType] || {
    name: formatTypeName(primaryType),
    icon: 'map-pin',
  };

  const category = {
    id: `google-${primaryType}`,
    name: categoryInfo.name,
    slug: slugify(categoryInfo.name, { lower: true, strict: true }),
    icon: categoryInfo.icon,
    description: '',
  };

  const subcategory = {
    id: `google-${primaryType}-${secondaryType || 'general'}`,
    category_id: category.id,
    name: secondaryType
      ? formatTypeName(secondaryType)
      : formatTypeName(primaryType),
    slug: slugify(secondaryType || primaryType, { lower: true, strict: true }),
    icon: categoryInfo.icon,
    description: '',
  };

  return { category, subcategory };
}

/**
 * Transforms Google Places search results to unified PlaceResults format
 */
export function transformGooglePlacesToPlaceResults(
  googlePlaces: FormattedGooglePlaceSearchResult[]
): PlaceResults[] {
  return googlePlaces.map((place) => {
    const now = new Date();

    // Map Google types to categories
    const { category, subcategory } = mapGoogleTypesToCategories(place.types);

    return {
      id: place.placeId,
      name: place.name,
      slug: slugify(place.name, { lower: true, strict: true }),
      description: place.formattedAddress || place.vicinity || '',
      contacts: [],
      main_image: place.gallery?.[0],
      gallery: place.gallery || [],

      // Default location data (would need proper geocoding for complete data)
      country: { id: '', name: '' },
      region: { id: '', name: '' },
      city: { id: '', name: '' },
      location: {
        lng: place.location.lng,
        lat: place.location.lat,
        name: place.formattedAddress || place.vicinity || '',
        street_address: place.vicinity || place.formattedAddress || '',
      },

      website: undefined,
      socials: [],

      // Use mapped categories from Google types
      category,
      subcategory,
      type: null,
      ownership: null,

      rating: place.rating
        ? {
            rate: place.rating,
            count: place.totalReviews || 0,
          }
        : undefined,
      distance: undefined,
      open_hours: [],
      open_now: place.openNow,
      features: [],
      services: [],
      tags: place.types || [],
      accessibility: [],

      created_at: now,
      updated_at: now,

      other_details: {
        google_data: {
          place_id: place.placeId,
          types: place.types,
          vicinity: place.vicinity,
          price_level: place.priceLevel,
        },
      },
      source: 'google_places',
      source_link: undefined,
      status: 'approved' as const,

      // Google Places specific fields
      google_place_id: place.placeId,
      google_place_types: place.types,
      price_level: place.priceLevel,
      business_status: undefined, // Not available in current format
      formatted_address: place.formattedAddress,
      international_phone_number: undefined, // Not available in current format
      vicinity: place.vicinity,
    };
  });
}
