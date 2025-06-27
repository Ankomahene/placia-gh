import { createClient } from '@/lib/supabase/client';
import type { PlaceResultsSummary } from '@/types/place';
import { parseNaturalLanguageQuery } from '.';
import { geocodeLocation } from './google/places';
import { StructuredSearchQuery } from '@/types/search';

const supabase = createClient();

interface SearchParams {
  naturalQuery: string;
  userLocation?: { lat: number; lng: number };
  limit?: number;
  offset?: number;
  useCache?: boolean; // New parameter to indicate if we should use cached structured query
  usePreviousQuery?: boolean; // New parameter to indicate if we should use previous query
  defaultStructuredQuery?: StructuredSearchQuery;
}

interface SearchResult {
  results: PlaceResultsSummary[];
  count: number;
  success: boolean;
  query: string;
  executionTime: number;
  search_type?: string;
  sort_order?: string;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class SmartPlaceSearch {
  private lastStructuredQuery: StructuredSearchQuery | null = null; // Cache for pagination

  // Add this helper method to clean search queries
  private cleanSearchQuery(query: string): string {
    // Remove excessive operators and clean up the query
    return query
      .replace(/\s*&\s*&\s*/g, ' & ') // Clean up double ampersands
      .replace(/\s*\|\s*\|\s*/g, ' | ') // Clean up double pipes
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  // Enhanced search with natural language processing
  async searchWithAI({
    naturalQuery,
    userLocation,
    limit = 20,
    offset = 0,
    useCache = false,
    defaultStructuredQuery,
  }: SearchParams & {
    previousQuery?: StructuredSearchQuery;
  }): Promise<SearchResult> {
    try {
      let structuredQuery: StructuredSearchQuery;

      // Use cached structured query if available and requested (for pagination)
      if (useCache && this.lastStructuredQuery) {
        structuredQuery = this.lastStructuredQuery;
      } else {
        // Parse the natural language query into structured format
        structuredQuery = await parseNaturalLanguageQuery(
          naturalQuery,
          userLocation,
          defaultStructuredQuery
        );

        // Cache the structured query for pagination
        this.lastStructuredQuery = structuredQuery;
      }

      const searchType = structuredQuery?.search_type || 'general';
      const searchQuery = `${structuredQuery.query} ${structuredQuery.location ? '& ' + structuredQuery.location : ''} ${structuredQuery.tags ? '& ' + structuredQuery.tags.join(' | ') : ''}`;
      const cleanedQuery = this.cleanSearchQuery(searchQuery);

      switch (searchType) {
        case 'proximity':
          return this.searchByProximity(
            cleanedQuery,
            userLocation || { lat: 0, lng: 0 },
            structuredQuery.location || '',
            structuredQuery.radius_meters || 5000,
            limit,
            offset,
            structuredQuery.sort_order || 'nearest_first'
          );
        case 'rating':
          return this.searchByRating(
            cleanedQuery,
            structuredQuery.min_rating || 4,
            5, // max_rating - not in StructuredSearchQuery
            limit,
            offset,
            structuredQuery.sort_order || 'highest_first',
            userLocation,
            structuredQuery.location || ''
          );
        case 'price_level':
          return this.searchByPriceLevel(
            cleanedQuery,
            structuredQuery.min_price_level || 1,
            structuredQuery.max_price_level || 4,
            limit,
            offset,
            structuredQuery.sort_order || 'cheapest_first',
            userLocation,
            structuredQuery.location || ''
          );
        default:
          return this.generalSearch(cleanedQuery, limit, offset);
      }
    } catch (error) {
      console.error('Enhanced search error:', error);
      return {
        results: [],
        count: 0,
        success: false,
        query: naturalQuery,
        executionTime: 0,
        search_type: 'general',
        pagination: {
          limit,
          offset,
          hasMore: false,
        },
      };
    }
  }

  // Clear cached structured query
  clearCache(): void {
    this.lastStructuredQuery = null;
  }

  // Search for nearby places with location resolution
  async searchByProximity(
    query: string,
    userLocation: { lat: number; lng: number } | null,
    locationName: string,
    radius: number,
    limit = 20,
    offset = 0,
    order = 'nearest_first' // nearest_first or farthest_first
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      let searchLocation = userLocation;

      // If no user location, geocode the location name
      if (!userLocation && locationName) {
        try {
          const geocoded = await geocodeLocation(locationName);
          searchLocation = { lat: geocoded.lat, lng: geocoded.lng };
        } catch (error) {
          console.error('Failed to geocode location:', error);
          return {
            results: [],
            count: 0,
            success: false,
            query,
            executionTime: Date.now() - startTime,
            search_type: 'proximity',
            pagination: {
              limit,
              offset,
              hasMore: false,
            },
          };
        }
      }

      if (!searchLocation) {
        throw new Error('No location provided');
      }

      // Use default radius based on search type
      const searchRadius = radius || (userLocation ? 5000 : 10000);
      const sortOrder = order;

      const { data, error } = await supabase.rpc('search_places_by_proximity', {
        center_lat: searchLocation.lat,
        center_lng: searchLocation.lng,
        search_query: query,
        max_distance: searchRadius,
        min_rating: 0,
        max_rating: 5,
        min_price_level: 1,
        max_price_level: 4,
        sort_order: sortOrder,
        limit_results: limit,
        offset_results: offset,
      });

      if (error) throw error;

      const results = data || [];
      const executionTime = Date.now() - startTime;

      if (results.length === 0) {
        const generalSearchResults = await this.generalSearch(
          query,
          limit,
          offset
        );
        return {
          ...generalSearchResults,
          results: generalSearchResults.results.sort(
            (a, b) => (b?.distance || 0) - (a?.distance || 0)
          ),
          executionTime: Date.now() - startTime,
          search_type: 'proximity',
          sort_order: order,
        };
      }

      return {
        results,
        count: results.length,
        success: true,
        query,
        executionTime,
        search_type: 'proximity',
        sort_order: order,
        pagination: {
          limit,
          offset,
          hasMore: results.length === limit,
        },
      };
    } catch (error) {
      console.error('Proximity search error:', error);
      return {
        results: [],
        count: 0,
        success: false,
        query,
        executionTime: Date.now() - startTime,
        search_type: 'proximity',
        sort_order: order,
        pagination: {
          limit,
          offset,
          hasMore: false,
        },
      };
    }
  }

  async searchByRating(
    query: string,
    minRating: number,
    maxRating: number,
    limit = 20,
    offset = 0,
    order = 'highest_first', // highest_first or lowest_first
    userLocation?: { lat: number; lng: number },
    locationName?: string
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      let searchLocation = userLocation;

      // If location name provided but no coordinates, geocode it
      if (!userLocation && locationName) {
        try {
          const geocoded = await geocodeLocation(locationName);
          searchLocation = { lat: geocoded.lat, lng: geocoded.lng };
        } catch (error) {
          console.warn('Failed to geocode location for rating search:', error);
        }
      }

      const sortOrder =
        order === 'lowest_first' ? 'lowest_first' : 'highest_first';

      const { data, error } = await supabase.rpc('search_places_by_rating', {
        search_query: query,
        min_rating: minRating,
        max_rating: maxRating,
        center_lat: searchLocation?.lat || null,
        center_lng: searchLocation?.lng || null,
        max_distance: 25000,
        sort_order: sortOrder,
        limit_results: limit,
        offset_results: offset,
      });

      if (error) throw error;

      const results = data || [];
      const executionTime = Date.now() - startTime;

      if (results.length === 0) {
        const generalSearchResults = await this.generalSearch(
          query,
          limit,
          offset
        );
        return {
          ...generalSearchResults,
          results: generalSearchResults.results.sort(
            (a, b) => (b?.rate_average || 0) - (a?.rate_average || 0)
          ),
          executionTime: Date.now() - startTime,
          search_type: 'rating',
        };
      }

      return {
        results,
        count: results.length,
        success: true,
        query,
        executionTime,
        search_type: 'rating',
        sort_order: order,
        pagination: {
          limit,
          offset,
          hasMore: results.length === limit,
        },
      };
    } catch (error) {
      console.error('Rating search error:', error);
      return {
        results: [],
        count: 0,
        success: false,
        query,
        executionTime: Date.now() - startTime,
        search_type: 'rating',
        sort_order: order,
        pagination: {
          limit,
          offset,
          hasMore: false,
        },
      };
    }
  }

  // Search for budget-friendly places
  async searchByPriceLevel(
    query: string,
    minPriceLevel: number,
    maxPriceLevel: number,
    limit = 20,
    offset = 0,
    order = 'cheapest_first', // cheapest_first or most_expensive_first
    userLocation?: { lat: number; lng: number },
    locationName?: string
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      let searchLocation = userLocation;

      // If location name provided but no coordinates, geocode it
      if (!userLocation && locationName) {
        try {
          const geocoded = await geocodeLocation(locationName);
          searchLocation = { lat: geocoded.lat, lng: geocoded.lng };
        } catch (error) {
          console.warn(
            'Failed to geocode location for price level search:',
            error
          );
        }
      }

      const sortOrder =
        order === 'most_expensive_first'
          ? 'most_expensive_first'
          : 'cheapest_first';

      const { data, error } = await supabase.rpc(
        'search_places_by_price_level',
        {
          search_query: query,
          min_price_level: minPriceLevel,
          max_price_level: maxPriceLevel,
          center_lat: searchLocation?.lat || null,
          center_lng: searchLocation?.lng || null,
          max_distance: 25000,
          sort_order: sortOrder,
          limit_results: limit,
          offset_results: offset,
        }
      );

      if (error) throw error;

      const results = data || [];
      const executionTime = Date.now() - startTime;

      if (results.length === 0) {
        const generalSearchResults = await this.generalSearch(
          query,
          limit,
          offset
        );
        return {
          ...generalSearchResults,
          results: generalSearchResults.results.sort(
            (a, b) => (a?.price_level || 1) - (b?.price_level || 1)
          ),
          executionTime: Date.now() - startTime,
          search_type: 'price_level',
        };
      }

      return {
        results,
        count: results.length,
        success: true,
        query,
        executionTime,
        search_type: 'price_level',
        sort_order: order,
        pagination: {
          limit,
          offset,
          hasMore: results.length === limit,
        },
      };
    } catch (error) {
      console.error('Price level search error:', error);
      return {
        results: [],
        count: 0,
        success: false,
        query,
        executionTime: Date.now() - startTime,
        search_type: 'price_level',
        sort_order: order,
        pagination: {
          limit,
          offset,
          hasMore: false,
        },
      };
    }
  }

  // Database functions now return PlaceResultsSummary directly

  // Simple method to test if full-text search is working
  async generalSearch(
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const { data, count, error } = await this.getSearchQuery(query, limit)
        .range(offset, offset + limit - 1)
        .order('rate_average', { ascending: false });

      if (error) throw error;
      const executionTime = Date.now() - startTime;

      // Transform the data to match PlaceResultsSummary format
      const results = (data || []).map((place: any) => ({
        id: place.id,
        name: place.name,
        slug: place.slug,
        description: place.description,
        main_image: place.main_image,
        gallery: place.gallery,
        distance: place.distance,
        open_now: place.open_now,
        location: place.location,
        rate_average: place.rate_average,
        rate_count: place.rate_count,
        rate_label: place.rate_label,
        price_level: place.price_level,
        price_level_count: place.price_level_count,
        price_level_label: place.price_level_label,
        features: place.features,
        services: place.services,
        tags: place.tags,
        accessibility: place.accessibility,
        source: place.source,
        country: place.country || {},
        region: place.region || {},
        city: place.city || {},
        category: place.category || {},
        subcategory: place.subcategory || {},
        type: place.type || null,
        ownership: place.ownership || null,
      }));

      return {
        results,
        count: count || results.length,
        success: true,
        query,
        executionTime,
        search_type: 'general',
        pagination: {
          limit,
          offset,
          hasMore: offset + results.length < (count || 0),
        },
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        results: [],
        count: 0,
        query,
        executionTime: Date.now() - startTime,
        search_type: 'general',
        sort_order: undefined, // General search doesn't have specific sort order
        pagination: {
          limit,
          offset,
          hasMore: false,
        },
      };
    }
  }

  private getSearchQuery(query: string, limit: number = 20) {
    return supabase
      .from('places')
      .select(
        `
          id,
          name,
          slug,
          description,
          main_image,
          gallery,
          location,
          rate_average,
          rate_count,
          rate_label,
          price_level,
          price_level_count,
          price_level_label,
          features,
          services,
          tags,
          accessibility,
          source,
          country: countries(id, name),
          region: regions(id, name),
          city: cities(id, name), 
          category: categories(id, name),
          subcategory: subcategories(id, name),
          type: types(id, name),
          ownership: ownerships(id, type)
        `,
        { count: 'exact' }
      )
      .in('status', ['approved', 'scraped'])
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english',
      })
      .limit(limit);
  }
}

// Export a singleton instance
export const smartPlaceSearch = new SmartPlaceSearch();
