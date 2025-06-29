import { StructuredSearchQuery } from '@/types/search';

export interface PregeneratedQuery {
  query: string;
  structuredQuery: StructuredSearchQuery;
}

export const PREGENERATED_QUERIES: PregeneratedQuery[] = [
  // Restaurant searches
  {
    query: 'Find me the best restaurants in Accra',
    structuredQuery: {
      query: 'best restaurants',
      location: 'Accra',
      category: 'Food & Dining',
      subcategory: 'Restaurant',
      search_type: 'rating',
      min_rating: 4.0,
      radius_meters: 10000,
      type: 'restaurant',
      tags: ['restaurant', 'best', 'food'],
      sort_order: 'highest_first',
    },
  },
  {
    query: 'Budget friendly restaurants near me',
    structuredQuery: {
      query: 'budget friendly restaurants',
      category: 'Food & Dining',
      subcategory: 'Restaurant',
      search_type: 'price_level',
      min_price_level: 1,
      max_price_level: 2,
      use_user_location: true,
      radius_meters: 3000,
      type: 'restaurant',
      tags: ['restaurant', 'budget', 'affordable'],
      sort_order: 'cheapest_first',
    },
  },
  {
    query: 'Restaurants open now within 5km',
    structuredQuery: {
      query: 'restaurants open now',
      category: 'Food & Dining',
      subcategory: 'Restaurant',
      search_type: 'proximity',
      open_now: true,
      use_user_location: true,
      radius_meters: 5000,
      type: 'restaurant',
      tags: ['restaurant', 'open now'],
    },
  },
  {
    query: 'Best jollof restaurants in East Legon',
    structuredQuery: {
      query: 'best jollof restaurants',
      location: 'East Legon',
      category: 'Food & Dining',
      subcategory: 'Restaurant',
      search_type: 'rating',
      min_rating: 4.0,
      radius_meters: 5000,
      type: 'restaurant',
      tags: ['restaurant', 'jollof', 'local food'],
      sort_order: 'highest_first',
    },
  },
  {
    query: 'Fast food restaurants with delivery near me',
    structuredQuery: {
      query: 'fast food restaurants delivery',
      category: 'Food & Dining',
      subcategory: 'Fast Food',
      features: ['delivery'],
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 5000,
      type: 'restaurant',
      tags: ['fast food', 'delivery'],
    },
  },
  {
    query: 'Best restaurants around my current location',
    structuredQuery: {
      query: 'best restaurants',
      category: 'Food & Dining',
      subcategory: 'Restaurant',
      search_type: 'rating',
      min_rating: 4.0,
      use_user_location: true,
      radius_meters: 8000,
      type: 'restaurant',
      tags: ['restaurant', 'best', 'food'],
      sort_order: 'highest_first',
    },
  },

  // Healthcare searches
  {
    query: 'Hospitals near me',
    structuredQuery: {
      query: 'hospitals',
      category: 'Healthcare',
      subcategory: 'Hospital',
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 10000,
      type: 'hospital',
      tags: ['hospital', 'healthcare'],
    },
  },
  {
    query: '24-hour pharmacies with parking near me',
    structuredQuery: {
      query: '24-hour pharmacies',
      category: 'Healthcare',
      subcategory: 'Pharmacy',
      features: ['24-hour', 'parking'],
      search_type: 'proximity',
      open_now: true,
      use_user_location: true,
      radius_meters: 3000,
      type: 'pharmacy',
      tags: ['pharmacy', '24-hour', 'parking'],
    },
  },
  {
    query: 'Pharmacies open now within 5km of my location',
    structuredQuery: {
      query: 'pharmacies open now',
      category: 'Healthcare',
      subcategory: 'Pharmacy',
      search_type: 'proximity',
      open_now: true,
      use_user_location: true,
      radius_meters: 5000,
      type: 'pharmacy',
      tags: ['pharmacy', 'open now'],
    },
  },
  {
    query: 'Best hospitals in Accra',
    structuredQuery: {
      query: 'best hospitals',
      location: 'Accra',
      category: 'Healthcare',
      subcategory: 'Hospital',
      search_type: 'rating',
      min_rating: 4.0,
      radius_meters: 10000,
      type: 'hospital',
      tags: ['hospital', 'best', 'healthcare'],
      sort_order: 'highest_first',
    },
  },

  // Education searches
  {
    query: 'International schools in East Legon',
    structuredQuery: {
      query: 'international schools',
      location: 'East Legon',
      category: 'Education',
      subcategory: 'International School',
      radius_meters: 8000,
      type: 'school',
      tags: ['school', 'international', 'education'],
    },
  },
  {
    query: 'Affordable schools in my area',
    structuredQuery: {
      query: 'affordable schools',
      category: 'Education',
      subcategory: 'School',
      search_type: 'price_level',
      min_price_level: 1,
      max_price_level: 2,
      use_user_location: true,
      radius_meters: 8000,
      type: 'school',
      tags: ['school', 'affordable', 'education'],
      sort_order: 'cheapest_first',
    },
  },
  {
    query: 'Top rated universities in Ghana',
    structuredQuery: {
      query: 'top rated universities',
      region: 'GH',
      category: 'Education',
      subcategory: 'University',
      search_type: 'rating',
      min_rating: 4.5,
      type: 'university',
      tags: ['university', 'top rated', 'higher education'],
      sort_order: 'highest_first',
    },
  },

  // Religious places
  {
    query: 'Churches near me',
    structuredQuery: {
      query: 'churches',
      category: 'Religion',
      subcategory: 'Church',
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 5000,
      type: 'church',
      tags: ['church', 'worship', 'religion'],
    },
  },
  {
    query: 'Mosques in Accra with prayer times',
    structuredQuery: {
      query: 'mosques prayer times',
      location: 'Accra',
      category: 'Religion',
      subcategory: 'Mosque',
      features: ['prayer times'],
      radius_meters: 10000,
      type: 'mosque',
      tags: ['mosque', 'prayer', 'islam'],
    },
  },

  // Banking & Finance
  {
    query: 'Banks with ATM near me',
    structuredQuery: {
      query: 'banks with ATM',
      category: 'Finance',
      subcategory: 'Bank',
      features: ['ATM'],
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 3000,
      type: 'bank',
      tags: ['bank', 'ATM', 'finance'],
    },
  },
  {
    query: 'Mobile money agents in Tema',
    structuredQuery: {
      query: 'mobile money agents',
      location: 'Tema',
      category: 'Finance',
      subcategory: 'Mobile Money Agent',
      radius_meters: 5000,
      type: 'finance',
      tags: ['mobile money', 'momo', 'agent'],
    },
  },

  // Shopping
  {
    query: 'Shopping malls in Accra',
    structuredQuery: {
      query: 'shopping malls',
      location: 'Accra',
      category: 'Shopping & Commerce',
      subcategory: 'Shopping Mall',
      radius_meters: 15000,
      type: 'shopping_mall',
      tags: ['shopping', 'mall', 'retail'],
    },
  },
  {
    query: 'Local markets open today',
    structuredQuery: {
      query: 'local markets',
      category: 'Shopping & Commerce',
      subcategory: 'Market',
      open_now: true,
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 8000,
      type: 'establishment',
      tags: ['market', 'local', 'shopping'],
    },
  },
  {
    query: 'Electronics shops with warranty near me',
    structuredQuery: {
      query: 'electronics shops warranty',
      category: 'Shopping & Commerce',
      subcategory: 'Electronics Store',
      features: ['warranty'],
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 5000,
      type: 'electronics_store',
      tags: ['electronics', 'warranty', 'gadgets'],
    },
  },

  // Entertainment & Recreation
  {
    query: 'Movie theaters with IMAX near me',
    structuredQuery: {
      query: 'movie theaters IMAX',
      category: 'Recreation & Entertainment',
      subcategory: 'Cinema',
      features: ['IMAX'],
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 15000,
      type: 'movie_theater',
      tags: ['cinema', 'movies', 'IMAX'],
    },
  },
  {
    query: 'Night clubs in Osu',
    structuredQuery: {
      query: 'night clubs',
      location: 'Osu',
      category: 'Nightlife & Social Spaces',
      subcategory: 'Night Club',
      radius_meters: 3000,
      type: 'night_club',
      tags: ['nightclub', 'entertainment', 'nightlife'],
    },
  },
  {
    query: 'Gyms with swimming pools near me',
    structuredQuery: {
      query: 'gyms swimming pools',
      category: 'Recreation & Entertainment',
      subcategory: 'Gym',
      features: ['swimming pool'],
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 8000,
      type: 'gym',
      tags: ['gym', 'fitness', 'swimming'],
    },
  },

  // Accommodation
  {
    query: 'Budget hotels near Kotoka Airport',
    structuredQuery: {
      query: 'budget hotels',
      location: 'Kotoka Airport',
      category: 'Accommodation & Hospitality',
      subcategory: 'Hotel',
      search_type: 'price_level',
      min_price_level: 1,
      max_price_level: 2,
      radius_meters: 5000,
      type: 'lodging',
      tags: ['hotel', 'budget', 'airport'],
      sort_order: 'cheapest_first',
    },
  },
  {
    query: 'Luxury hotels in Accra',
    structuredQuery: {
      query: 'luxury hotels',
      location: 'Accra',
      category: 'Accommodation & Hospitality',
      subcategory: 'Luxury Hotel',
      search_type: 'price_level',
      min_price_level: 4,
      max_price_level: 4,
      min_rating: 4.5,
      radius_meters: 10000,
      type: 'lodging',
      tags: ['hotel', 'luxury', 'premium'],
      sort_order: 'most_expensive_first',
    },
  },

  // Transportation
  {
    query: 'Car rental services with GPS near me',
    structuredQuery: {
      query: 'car rental GPS',
      category: 'Transportation & Travel',
      subcategory: 'Car Rental',
      features: ['GPS'],
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 10000,
      type: 'car_rental',
      tags: ['car rental', 'GPS', 'transport'],
    },
  },
  {
    query: 'Taxi services near me',
    structuredQuery: {
      query: 'taxi services',
      category: 'Transportation & Travel',
      subcategory: 'Taxi Service',
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 2000,
      type: 'taxi_stand',
      tags: ['taxi', 'transport', 'ride'],
    },
  },

  // Beauty & Personal Care
  {
    query: 'Hair salons with natural hair care near me',
    structuredQuery: {
      query: 'hair salons natural hair',
      category: 'Grooming & Personal Care',
      subcategory: 'Hair Salon',
      features: ['natural hair care'],
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 5000,
      type: 'hair_care',
      tags: ['salon', 'natural hair', 'beauty'],
    },
  },
  {
    query: 'Barbershops open late',
    structuredQuery: {
      query: 'barbershops open late',
      category: 'Grooming & Personal Care',
      subcategory: 'Barbershop',
      features: ['open late'],
      opened_at: '20:00',
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 8000,
      type: 'hair_care',
      tags: ['barbershop', 'late hours', 'grooming'],
    },
  },

  // Automotive
  {
    query: 'Car repair shops with diagnostics near me',
    structuredQuery: {
      query: 'car repair diagnostics',
      category: 'Industry & Business',
      subcategory: 'Auto Repair',
      features: ['diagnostics'],
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 8000,
      type: 'car_repair',
      tags: ['auto repair', 'diagnostics', 'mechanic'],
    },
  },
  {
    query: 'Gas stations with convenience stores near me',
    structuredQuery: {
      query: 'gas stations convenience store',
      category: 'Transportation & Travel',
      subcategory: 'Gas Station',
      features: ['convenience store'],
      search_type: 'proximity',
      use_user_location: true,
      radius_meters: 5000,
      type: 'gas_station',
      tags: ['fuel', 'gas', 'convenience'],
    },
  },
];

/**
 * Search for pregenerated queries that match the user's input
 * @param searchText - The text user is typing
 * @param limit - Maximum number of suggestions to return
 * @returns Array of matching pregenerated queries
 */
export function searchPregeneratedQueries(
  searchText: string,
  limit: number = 5
): PregeneratedQuery[] {
  console.log(
    'searchPregeneratedQueries called with:',
    searchText,
    'length:',
    searchText.length
  );

  if (!searchText || searchText.trim().length < 2) {
    console.log(
      'searchPregeneratedQueries: searchText too short, returning empty array'
    );
    return [];
  }

  const normalizedSearchText = searchText.toLowerCase().trim();
  console.log(
    'searchPregeneratedQueries: normalized text:',
    normalizedSearchText
  );

  // Find exact matches first, then partial matches
  const exactMatches = PREGENERATED_QUERIES.filter((item) =>
    item.query.toLowerCase().includes(normalizedSearchText)
  );

  console.log(
    'searchPregeneratedQueries: exact matches found:',
    exactMatches.length
  );

  // If we have enough exact matches, return them
  if (exactMatches.length >= limit) {
    console.log(
      'searchPregeneratedQueries: returning exact matches:',
      exactMatches.slice(0, limit)
    );
    return exactMatches.slice(0, limit);
  }

  // Otherwise, also search by keywords from structured query
  const keywordMatches = PREGENERATED_QUERIES.filter((item) => {
    const query = item.query.toLowerCase();
    const structuredQuery = item.structuredQuery;

    // Skip if already in exact matches
    if (exactMatches.some((exact) => exact.query === item.query)) {
      return false;
    }

    // Check tags, category, subcategory for matches
    const searchableText = [
      query,
      structuredQuery.category?.toLowerCase(),
      structuredQuery.subcategory?.toLowerCase(),
      structuredQuery.location?.toLowerCase(),
      ...(structuredQuery.tags || []).map((tag) => tag.toLowerCase()),
      ...(structuredQuery.features || []).map((feature) =>
        feature.toLowerCase()
      ),
    ]
      .filter(Boolean)
      .join(' ');

    const matches = searchableText.includes(normalizedSearchText);
    if (matches) {
      console.log(
        `searchPregeneratedQueries: keyword match found for "${item.query}" with searchable text:`,
        searchableText
      );
    }
    return matches;
  });

  console.log(
    'searchPregeneratedQueries: keyword matches found:',
    keywordMatches.length
  );

  // Combine and limit results
  const combined = [...exactMatches, ...keywordMatches];
  console.log(
    'searchPregeneratedQueries: total combined results:',
    combined.length
  );
  const result = combined.slice(0, limit);
  console.log('searchPregeneratedQueries: final result:', result);
  return result;
}

// Add a test function to help debug
export function testSearch(searchText: string) {
  console.log('=== Testing search for:', searchText, '===');
  const results = searchPregeneratedQueries(searchText, 5);
  console.log(
    'Results:',
    results.map((r) => r.query)
  );
  return results;
}

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testSearch = testSearch;
  (window as any).searchPregeneratedQueries = searchPregeneratedQueries;
}

/**
 * Find an exact pregenerated query match
 * @param query - The exact query string to match
 * @returns The matching pregenerated query or null
 */
export function findExactPregeneratedQuery(
  query: string
): PregeneratedQuery | null {
  const normalizedQuery = query.trim().toLowerCase();
  return (
    PREGENERATED_QUERIES.find(
      (item) => item.query.toLowerCase() === normalizedQuery
    ) || null
  );
}
