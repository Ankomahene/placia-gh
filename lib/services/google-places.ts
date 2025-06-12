import { Client } from '@googlemaps/google-maps-services-js';
import {
  StructuredSearchQuery,
  GooglePlaceSearchResult,
  GooglePlaceDetails,
  GoogleGeocodingResult,
  FormattedGooglePlaceSearchResult,
} from '@/types/search';

const client = new Client({});
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}

export async function searchPlaces(
  structuredQuery: StructuredSearchQuery
): Promise<GooglePlaceSearchResult[]> {
  try {
    const {
      query,
      location,
      radius_meters = 5000,
      min_rating,
      open_now,
    } = structuredQuery;

    let searchLocation: { lat: number; lng: number } | undefined;

    // If location is provided, geocode it first
    if (location) {
      searchLocation = await geocodeLocation(location);
    }

    const searchParams: any = {
      key: GOOGLE_API_KEY,
      query: query,
      type: 'establishment',
    };

    // Use location if available
    if (searchLocation) {
      searchParams.location = `${searchLocation.lat},${searchLocation.lng}`;
      searchParams.radius = 25000;
    }

    // Add filters
    if (min_rating) {
      searchParams.minprice = 0;
      searchParams.maxprice = 4;
    }

    if (open_now) {
      searchParams.opennow = true;
    }

    const response = await client.textSearch({
      params: searchParams,
    });

    const results = response.data.results || [];

    // Filter by minimum rating if specified
    const filteredResults = min_rating
      ? results.filter((place) => (place.rating || 0) >= min_rating)
      : results;

    return filteredResults
      .filter(
        (place) => place.place_id && place.name && place.geometry?.location
      )
      .map((place) => ({
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
        formatted_address: place.formatted_address,
        open_now: place.opening_hours?.open_now,
      }));
  } catch (error) {
    console.error('Error searching places:', error);
    throw new Error('Failed to search places');
  }
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

export async function searchPlacesWithTextSearch(
  structuredQuery: StructuredSearchQuery
): Promise<FormattedGooglePlaceSearchResult[]> {
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

    console.log('--------------------------------');
    console.log('searchParams', searchParams);
    console.log('--------------------------------');
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

    return formattedResults;
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
