import { smartPlaceSearch } from './smart-search';
import { StructuredSearchQuery } from '@/types/search';

// Example usage of the simplified pre-generated query system

// Define some common search patterns as default structured queries
export const COMMON_SEARCHES: Record<string, StructuredSearchQuery> = {
  'restaurants-near-me': {
    query: 'restaurants',
    category: 'Food & Dining',
    subcategory: 'Restaurant',
    search_type: 'proximity',
    radius_meters: 2000,
    user_location: { lat: 0, lng: 0 }, // Will be overridden with actual user location
    type: 'restaurant',
    tags: ['restaurant', 'food', 'dining'],
  },

  'hotels-near-airport': {
    query: 'hotels',
    location: 'Kotoka international airport',
    category: 'Accommodation & Hospitality',
    subcategory: 'Hotel',
    search_type: 'proximity',
    radius_meters: 5000,
    type: 'lodging',
    tags: ['hotel', 'accommodation', 'airport'],
  },

  'best-restaurants-accra': {
    query: 'best restaurants',
    location: 'Accra',
    category: 'Food & Dining',
    subcategory: 'Restaurant',
    search_type: 'rating',
    min_rating: 4.0,
    radius_meters: 25000,
    sort_order: 'highest_first',
    type: 'restaurant',
    tags: ['restaurant', 'best', 'highly rated', 'quality'],
  },

  'budget-restaurants': {
    query: 'budget friendly restaurants',
    category: 'Food & Dining',
    subcategory: 'Restaurant',
    search_type: 'price_level',
    min_price_level: 1,
    max_price_level: 1,
    sort_order: 'cheapest_first',
    type: 'restaurant',
    tags: ['restaurant', 'budget', 'affordable', 'cheap'],
  },

  'pharmacies-24-hour': {
    query: '24-hour pharmacies',
    category: 'Healthcare',
    subcategory: 'Pharmacy',
    search_type: 'proximity',
    radius_meters: 5000,
    user_location: { lat: 0, lng: 0 }, // Will be overridden with actual user location
    features: ['24-hour'],
    open_now: true,
    type: 'pharmacy',
    tags: ['pharmacy', 'healthcare', '24-hour', 'emergency'],
  },
};

// Example usage functions

/**
 * Search using a pre-defined structured query (no OpenAI call for initial search)
 */
export async function searchWithPreDefinedQuery(
  searchKey: keyof typeof COMMON_SEARCHES,
  userLocation?: { lat: number; lng: number },
  limit: number = 20,
  offset: number = 0
) {
  const defaultQuery = COMMON_SEARCHES[searchKey];

  if (!defaultQuery) {
    throw new Error(`Search pattern "${searchKey}" not found`);
  }

  // Use the search service with the default structured query
  return await smartPlaceSearch.searchWithAI({
    naturalQuery: defaultQuery.query,
    defaultStructuredQuery: defaultQuery,
    userLocation,
    limit,
    offset,
  });
}

/**
 * Start a conversation with a pre-defined query, then handle follow-ups
 */
export async function startConversationWithPreDefinedQuery(
  searchKey: keyof typeof COMMON_SEARCHES,
  userLocation?: { lat: number; lng: number }
) {
  const defaultQuery = COMMON_SEARCHES[searchKey];

  if (!defaultQuery) {
    throw new Error(`Search pattern "${searchKey}" not found`);
  }

  // Reset conversation to start fresh
  smartPlaceSearch.resetConversation();

  // First search uses the pre-defined query (no OpenAI call)
  const initialResult = await smartPlaceSearch.searchWithAI({
    naturalQuery: defaultQuery.query,
    defaultStructuredQuery: defaultQuery,
    userLocation,
  });

  // Add the structured query to conversation history manually
  // since we bypassed the conversational search method
  smartPlaceSearch['conversationHistory'].push(defaultQuery);

  return initialResult;
}

/**
 * Continue conversation with follow-up queries (these will use OpenAI)
 */
export async function continueConversation(
  followUpQuery: string,
  userLocation?: { lat: number; lng: number }
) {
  return await smartPlaceSearch.conversationalSearch({
    naturalQuery: followUpQuery,
    userLocation,
  });
}

// Example usage scenarios:

/*
// Scenario 1: Quick search with pre-defined pattern
const results = await searchWithPreDefinedQuery('restaurants-near-me', userLocation);

// Scenario 2: Start conversation and handle follow-ups
const initialResults = await startConversationWithPreDefinedQuery('hotels-near-airport', userLocation);

// Follow-up 1: "show me budget friendly ones" (uses OpenAI)
const budgetResults = await continueConversation('show me budget friendly ones', userLocation);

// Follow-up 2: "what about restaurants instead?" (uses OpenAI)
const restaurantResults = await continueConversation('what about restaurants instead?', userLocation);

// Scenario 3: Direct usage with custom default query
const customDefault: StructuredSearchQuery = {
  query: 'coffee shops',
  category: 'Food & Dining',
  subcategory: 'Cafe',
  search_type: 'proximity',
  radius_meters: 1000,
  features: ['wifi'],
  type: 'cafe',
  tags: ['coffee', 'cafe', 'wifi'],
};

const customResults = await smartPlaceSearch.searchWithAI({
  naturalQuery: 'coffee shops with wifi',
  defaultStructuredQuery: customDefault,
  userLocation,
});
*/
