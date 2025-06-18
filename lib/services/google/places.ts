import { Client } from '@googlemaps/google-maps-services-js';
import {
  StructuredSearchQuery,
  GooglePlaceSearchResult,
  GooglePlaceDetails,
  GoogleGeocodingResult,
  FormattedGooglePlaceSearchResult,
} from '@/types/search';
import {
  PlaceResults,
  PlaceCategory,
  PlaceSubcategory,
  PlaceResultsSummary,
} from '@/types/place';
import slugify from 'slugify';
import { parseNaturalLanguageQuery } from '../openai-search';

const client = new Client({});
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}

interface GoogleSearchParams {
  naturalQuery: string;
  userLocation?: { lat: number; lng: number };
  useCache?: boolean;
  pageToken?: string;
  defaultStructuredQuery?: StructuredSearchQuery;
}

interface SearchResult {
  results: PlaceResultsSummary[];
  success: boolean;
  query: string;
  nextPageToken?: string | null;
  search_type?: string;
}

export class GooglePlaceSearch {
  public lastStructuredQuery: StructuredSearchQuery | null = null;

  async search({
    naturalQuery,
    userLocation,
    useCache = false,
    pageToken,
    defaultStructuredQuery,
  }: GoogleSearchParams): Promise<SearchResult> {
    try {
      let structuredQuery: StructuredSearchQuery;

      if (useCache && this.lastStructuredQuery) {
        structuredQuery = this.lastStructuredQuery;
      } else {
        structuredQuery = await parseNaturalLanguageQuery(
          naturalQuery,
          userLocation,
          defaultStructuredQuery
        );
        this.lastStructuredQuery = structuredQuery;
      }

      const searchType = structuredQuery?.search_type || 'general';

      switch (searchType) {
        case 'proximity':
          return this.searchByProximity(structuredQuery, pageToken);
        case 'rating':
          return this.searchByRating(structuredQuery, pageToken);
        case 'price_level':
          return this.searchByPriceLevel(structuredQuery, pageToken);
        default:
          return this.generalSearch(structuredQuery, pageToken);
      }
    } catch (error) {
      console.error('Google search error:', error);
      return {
        results: [],
        success: false,
        query: naturalQuery,
        search_type: 'general',
      };
    }
  }

  async searchByProximity(
    structuredQuery: StructuredSearchQuery,
    pageToken?: string
  ): Promise<SearchResult> {
    const { user_location, location, query, sort_order } = structuredQuery;

    let searchLocation: { lat: number; lng: number } | null = null;

    try {
      // Prioritize specified location over user location for proximity searches
      if (location) {
        searchLocation = await geocodeLocation(location);
      } else if (user_location) {
        searchLocation = user_location;
      }

      if (!searchLocation) {
        return this.generalSearch(structuredQuery);
      }

      const { results, nextPageToken } = await nearbySearch(
        searchLocation,
        structuredQuery,
        pageToken
      );

      if (results.length === 0) {
        return this.generalSearch(structuredQuery);
      }

      let placeSummaries = transformGoogleSearchResultsToSummaries(results);

      placeSummaries = placeSummaries.map((place) => ({
        ...place,
        distance: this.getDistance(searchLocation!, {
          lat: place.location.lat,
          lng: place.location.lng,
        }),
      }));

      if (sort_order === 'farthest_first') {
        placeSummaries.sort((a, b) => (b.distance || 0) - (a.distance || 0));
      } else {
        placeSummaries.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      return {
        results: placeSummaries,
        success: true,
        query,
        nextPageToken,
        search_type: 'proximity',
      };
    } catch (error) {
      console.error('Error in searchByProximity:', error);
      return this.generalSearch(structuredQuery);
    }
  }

  async searchByRating(
    structuredQuery: StructuredSearchQuery,
    pageToken?: string
  ): Promise<SearchResult> {
    const { sort_order, query, use_user_location, user_location, location } =
      structuredQuery;

    let results: any[];
    let nextPageToken: string | null | undefined;
    let searchLocation: { lat: number; lng: number } | null = null;

    // Determine if we have a location to search near
    if (use_user_location && user_location) {
      searchLocation = user_location;
    } else if (location) {
      try {
        searchLocation = await geocodeLocation(location);
      } catch (error) {
        console.warn(
          'Could not geocode location for rating search, falling back to text search'
        );
      }
    }

    // Priority 1: If we have a location, search nearby first for better location-based results
    if (searchLocation) {
      try {
        const nearbyResults = await nearbySearch(
          searchLocation,
          structuredQuery,
          pageToken
        );
        results = nearbyResults.results;
        nextPageToken = nearbyResults.nextPageToken;
      } catch (error) {
        console.warn('Nearby search failed, falling back to text search');
        const searchResults = await searchGooglePlaces(
          structuredQuery,
          pageToken
        );
        results = searchResults.results;
        nextPageToken = searchResults.nextPageToken;
      }
    } else {
      // Priority 2: Regular search without location constraint
      const searchResults = await searchGooglePlaces(
        structuredQuery,
        pageToken
      );
      results = searchResults.results;
      nextPageToken = searchResults.nextPageToken;
    }

    // Fallback: If no results, try general search
    if (results.length === 0) {
      const fallbackResult = await this.generalSearch(
        structuredQuery,
        pageToken
      );
      return {
        ...fallbackResult,
        search_type: 'general',
      };
    }

    let placeSummaries = transformGoogleSearchResultsToSummaries(results);

    // Sort by rating based on sort_order
    if (sort_order === 'lowest_first') {
      placeSummaries.sort(
        (a, b) => (a.rate_average || 0) - (b.rate_average || 0)
      );
    } else {
      placeSummaries.sort(
        (a, b) => (b.rate_average || 0) - (a.rate_average || 0)
      );
    }

    return {
      results: placeSummaries,
      success: true,
      query,
      nextPageToken,
      search_type: 'rating',
    };
  }

  async searchByPriceLevel(
    structuredQuery: StructuredSearchQuery,
    pageToken?: string
  ): Promise<SearchResult> {
    const { sort_order, query, use_user_location, user_location, location } =
      structuredQuery;

    let results: any[];
    let nextPageToken: string | null | undefined;
    let searchLocation: { lat: number; lng: number } | null = null;

    // Determine if we have a location to search near
    if (use_user_location && user_location) {
      searchLocation = user_location;
    } else if (location) {
      try {
        searchLocation = await geocodeLocation(location);
      } catch (error) {
        console.warn(
          'Could not geocode location for price level search, falling back to text search'
        );
      }
    }

    // Priority 1: If we have a location, search nearby first for better location-based results
    if (searchLocation) {
      try {
        const nearbyResults = await nearbySearch(
          searchLocation,
          structuredQuery,
          pageToken
        );
        results = nearbyResults.results;
        nextPageToken = nearbyResults.nextPageToken;
      } catch (error) {
        console.warn('Nearby search failed, falling back to text search');
        const searchResults = await searchGooglePlaces(
          structuredQuery,
          pageToken
        );
        results = searchResults.results;
        nextPageToken = searchResults.nextPageToken;
      }
    } else {
      // Priority 2: Regular search without location constraint
      const searchResults = await searchGooglePlaces(
        structuredQuery,
        pageToken
      );
      results = searchResults.results;
      nextPageToken = searchResults.nextPageToken;
    }

    // Fallback: If no results, try general search
    if (results.length === 0) {
      const fallbackResult = await this.generalSearch(
        structuredQuery,
        pageToken
      );
      return {
        ...fallbackResult,
        search_type: 'general',
      };
    }

    let placeSummaries = transformGoogleSearchResultsToSummaries(results);

    // Sort by price level based on sort_order
    if (sort_order === 'most_expensive_first') {
      placeSummaries.sort(
        (a, b) => (b.price_level || 0) - (a.price_level || 0)
      );
    } else {
      placeSummaries.sort(
        (a, b) => (a.price_level || 0) - (b.price_level || 0)
      );
    }

    return {
      results: placeSummaries,
      success: true,
      query,
      nextPageToken,
      search_type: 'price_level',
    };
  }

  async generalSearch(
    structuredQuery: StructuredSearchQuery,
    pageToken?: string
  ): Promise<SearchResult> {
    const { results, nextPageToken } = await searchGooglePlaces(
      structuredQuery,
      pageToken
    );
    if (results.length === 0 && structuredQuery.search_type !== 'general') {
      // Fallback to general search.
      const generalQuery: StructuredSearchQuery = {
        ...structuredQuery,
        search_type: 'general',
      };
      const { results: fallbackResults, nextPageToken: fallbackToken } =
        await searchGooglePlaces(generalQuery);
      const summarizedResults =
        transformGoogleSearchResultsToSummaries(fallbackResults);
      return {
        results: summarizedResults,
        success: true,
        query: structuredQuery.query,
        nextPageToken: fallbackToken,
        search_type: 'general',
      };
    }

    const summarizedResults = transformGoogleSearchResultsToSummaries(results);
    return {
      results: summarizedResults,
      success: true,
      query: structuredQuery.query,
      nextPageToken,
      search_type: 'general',
    };
  }

  private getDistance(
    coords1: { lat: number; lng: number },
    coords2: { lat: number; lng: number }
  ) {
    const R = 6371e3; // metres
    const φ1 = (coords1.lat * Math.PI) / 180;
    const φ2 = (coords2.lat * Math.PI) / 180;
    const Δφ = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const Δλ = ((coords2.lng - coords1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  }
}

export const googlePlaceSearch = new GooglePlaceSearch();

export async function nearbySearch(
  location: { lat: number; lng: number },
  structuredQuery: StructuredSearchQuery,
  pageToken?: string
): Promise<{
  results: GooglePlaceSearchResult[];
  nextPageToken?: string | null;
}> {
  try {
    const {
      query,
      radius_meters = 5000,
      min_rating,
      open_now,
    } = structuredQuery;

    const searchParams: any = {
      key: GOOGLE_API_KEY,
    };

    if (pageToken) {
      searchParams.pagetoken = pageToken;
    } else {
      searchParams.location = `${location.lat},${location.lng}`;
      searchParams.radius = radius_meters;
      searchParams.keyword = query;
      searchParams.type = 'establishment';

      if (min_rating) {
        searchParams.minprice = 0;
        searchParams.maxprice = 4;
      }

      if (open_now) {
        searchParams.opennow = true;
      }
    }

    const response = await client.placesNearby({
      params: searchParams,
    });

    const results = response.data.results || [];

    // Filter by minimum rating if specified
    const filteredResults = min_rating
      ? results.filter((place) => (place.rating || 0) >= min_rating)
      : results;

    const mappedResults = filteredResults.map((place) => ({
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

    return {
      results: mappedResults,
      nextPageToken: response.data.next_page_token,
    };
  } catch (error) {
    console.error('Error in nearby search:', error);
    throw new Error('Failed to perform nearby search');
  }
}

function transformGooglePlaceDetailsToPlaceResults(
  place: GooglePlaceDetails
): PlaceResults {
  const { category, subcategory } = mapGoogleTypesToCategories(place.types);
  const gallery = place.photos?.map((photo) =>
    getGooglePhotoUrl(photo.photo_reference, 800)
  );

  const parseOpeningHours = (
    hours:
      | {
          open_now: boolean;
          weekday_text: string[];
        }
      | undefined
  ) => {
    if (!hours || !hours.weekday_text) return [];
    return hours.weekday_text
      .map((text) => {
        const parts = text.split(': ');
        if (parts.length < 2) return null;
        const day = parts[0];
        const time = parts.slice(1).join(': ');

        if (time.toLowerCase() === 'closed') return null;
        if (time.toLowerCase() === 'open 24 hours') {
          return { day, from: '00:00', to: '23:59' };
        }

        const timeParts = time.split('–');
        if (timeParts.length < 2) return null;

        return {
          day,
          from: timeParts[0].trim(),
          to: timeParts[1].trim(),
        };
      })
      .filter(Boolean) as { day: string; from: string; to: string }[];
  };

  const now = new Date();

  return {
    id: place.place_id,
    name: place.name,
    slug: slugify(place.name, { lower: true, strict: true }),
    description: place.formatted_address,
    contacts: place.formatted_phone_number
      ? [place.formatted_phone_number]
      : [],
    main_image: gallery?.[0],
    gallery: gallery || [],
    country: { id: '', name: '' },
    region: { id: '', name: '' },
    city: { id: '', name: '' },
    location: {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      name: place.formatted_address,
      street_address: place.vicinity || place.formatted_address,
    },
    website: place.website,
    socials: [],
    category,
    subcategory,
    type: null,
    ownership: null,
    rating:
      place.rating && place.user_ratings_total
        ? { rate: place.rating, count: place.user_ratings_total }
        : undefined,
    rate_average: place.rating,
    rate_count: place.user_ratings_total,
    price_level: place.price_level,
    open_hours: parseOpeningHours(place.opening_hours),
    open_now: place.opening_hours?.open_now,
    features: [],
    services: [],
    tags: place.types || [],
    accessibility: [],
    created_at: now,
    updated_at: now,
    other_details: {
      reviews: place.reviews,
    },
    source: 'google_places_details',
    source_link: place.url,
    status: 'approved',
    google_place_id: place.place_id,
    google_place_types: place.types,
    business_status: place.business_status,
    formatted_address: place.formatted_address,
    international_phone_number: place.formatted_phone_number,
    vicinity: place.vicinity,
  };
}

export async function getPlaceDetails(placeId: string): Promise<PlaceResults> {
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
          'vicinity',
          'business_status',
        ],
      },
    });

    const placeDetails = response.data.result;
    if (!placeDetails) {
      throw new Error('Place not found');
    }

    return transformGooglePlaceDetailsToPlaceResults(
      placeDetails as GooglePlaceDetails
    );
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
  structuredQuery: StructuredSearchQuery,
  pageToken?: string
): Promise<{
  results: FormattedGooglePlaceSearchResult[];
  nextPageToken?: string | null;
}> {
  try {
    const {
      query,
      location,
      region,
      radius_meters,
      min_price_level,
      max_price_level,
      open_now,
      category,
      language,
      user_location,
    } = structuredQuery;

    const searchParams: any = {
      key: GOOGLE_API_KEY,
    };

    if (pageToken) {
      searchParams.pagetoken = pageToken;
    } else {
      searchParams.query = query;
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

      // Only use user_location if no specific location is provided
      if (user_location && !location) {
        searchParams.location = `${user_location.lat},${user_location.lng}`;
        searchParams.radius = radius_meters || 5000;
      }

      // Add region if provided
      if (region) {
        searchParams.region = region;
      }

      // Add price range if provided (Google uses 0-4 scale)
      if (min_price_level !== undefined) {
        searchParams.minprice = Math.max(0, Math.min(4, min_price_level));
      }
      if (max_price_level !== undefined) {
        searchParams.maxprice = Math.max(0, Math.min(4, max_price_level));
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

    return {
      results: formattedResults,
      nextPageToken: response.data.next_page_token,
    };
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

function transformGoogleSearchResultsToSummaries(
  results: (GooglePlaceSearchResult | FormattedGooglePlaceSearchResult)[]
): PlaceResultsSummary[] {
  const formattedResults = results.map((p) => {
    if ('place_id' in p) {
      const gallery = p.photos?.map((photo) =>
        getGooglePhotoUrl(photo.photo_reference, 800)
      );
      return {
        placeId: p.place_id!,
        name: p.name!,
        location: {
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
        },
        rating: p.rating,
        totalReviews: p.user_ratings_total,
        priceLevel: p.price_level,
        types: p.types || [],
        vicinity: p.vicinity,
        formattedAddress: p.formatted_address,
        openNow: p.open_now,
        gallery: gallery || [],
      };
    }
    return p as FormattedGooglePlaceSearchResult;
  });

  return formattedResults.map((place) => {
    const { category, subcategory } = mapGoogleTypesToCategories(place.types);
    return {
      id: place.placeId,
      name: place.name,
      slug: slugify(place.name, { lower: true, strict: true }),
      description: place.formattedAddress || place.vicinity || '',
      main_image: place.gallery?.[0],
      gallery: place.gallery || [],
      country: { id: '', name: '' },
      region: { id: '', name: '' },
      city: { id: '', name: '' },
      location: {
        lng: place.location.lng,
        lat: place.location.lat,
        name: place.formattedAddress || place.vicinity || '',
        street_address: place.vicinity || place.formattedAddress || '',
      },
      category,
      subcategory,
      type: null,
      ownership: null,
      rate_average: place.rating,
      rate_count: place.totalReviews || 0,
      price_level: place.priceLevel,
      open_now: place.openNow,
      tags: place.types || [],
      source: 'google_places',
      google_place_types: place.types,
      formatted_address: place.formattedAddress,
      vicinity: place.vicinity,
      features: [],
      services: [],
      accessibility: [],
      international_phone_number: undefined, // Not available in current format
    };
  });
}
