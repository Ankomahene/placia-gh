import OpenAI from 'openai';
import { SearchType, StructuredSearchQuery } from '@/types/search';
import { PriceLevelLabel } from '@/types/place';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface UnifiedSearchOutput {
  query: string;
  location?: string;
  features?: string[];
  category?: string;
  subcategory?: string;
  radius_meters?: number;
  min_rating?: number;
  min_price_level?: number; // Direct numeric value (1-4)
  max_price_level?: number; // Direct numeric value (1-4)
  open_now?: boolean;
  has_website?: boolean;
  has_phone?: boolean;
  region?: string;
  language?: string;
  use_user_location?: boolean;
  type?: string;
  search_type?: SearchType;
  opened_at?: string;
  tags?: string[];
  sort_order?: string; // Exact database function sort order
  is_followup?: boolean;
  context_action?: 'refine' | 'filter' | 'new_search';
}

interface ConversationContext {
  previousQuery?: StructuredSearchQuery;
  searchHistory: StructuredSearchQuery[];
}

const UNIFIED_SYSTEM_PROMPT = `You are an intelligent search query parser that converts natural language search queries into structured JSON format for finding places and businesses in Ghana. You also handle conversational follow-up queries.

**CONVERSATION HANDLING:**
- **is_followup**: true if the query builds on or modifies a previous search (uses words like "those", "them", "these", "budget friendly ones", "show me cheaper options", "filter by", "sort by", etc.)
- **context_action**: 
  - "refine": Modify existing search parameters (price, rating, sort, filters) - PRESERVE location, radius, and core context
  - "filter": Add new filters to existing search - PRESERVE all previous parameters
  - "new_search": Different place type but PRESERVE location context unless explicitly changed

**CRITICAL CONTEXT PRESERVATION RULES:**
1. **Location Context**: Always preserve location and radius from previous queries unless explicitly changed
2. **Follow-up Refinements**: When refining (price, rating, sorting), keep the original location and search scope
3. **Place Type Changes**: When changing from "restaurants" to "hotels", preserve the location context
4. **Proximity Requirements**: Any proximity-based search MUST include radius_meters (default 5000m for named locations, 2000m for "near me")

Extract the following information from user queries:

1. **query** (required): Main search term (e.g., "coffee shop", "best Italian restaurants").
2. **location**: Specific location mentioned (e.g., "East Legon", "Accra").
3. **features**: Specific amenities (e.g., ["outdoor seating", "parking", "wifi", "24-hour"]).
4. **category**: General category (e.g., "Education", "Religion", "Finance", "Health", "Grooming & Personal Care", "Shopping & Commerce", "Food & Dining", "Accommodation & Hospitality", "Recreation & Entertainment", "Transportation & Travel", "Industry & Business", "Security & Safety", "Media & Communications", "Housing & Real Estate", "Nightlife & Social Spaces", "Air & Maritime", "Other" ).
5. **subcategory**: Specific type. Use explicit categories when mentioned (e.g., "Restaurant", "Hospital", "School", "Bank", etc). 
    Also infer from action verbs when place type is not directly stated: 
    - "eat", "grab food" → "Restaurant" or "Food Joint"
    - "shop", "buy" → "Shopping" or "Commerce"
    - "pray", "worship" → "Church" or "Mosque"
    - "study", "learn" → "School" or "Library"
    - "sleep", "stay" → "Hotel" or "Guest House"
  Prioritize the most likely place type for the action based on context.

6. **search_type** & **radius_meters**: Determine search intent and distance together:
   - **"proximity"**: Location-focused searches ("near me", "around", "close", "within X km/meters", "walking distance", etc.). 
   - Set radius: 500-1000m (walking), 2000-5000m (nearby), 10000-25000m (city-wide)
   - **"rating"**: Quality-focused ("best", "top", "excellent", "highly rated", "premium", "outstanding")
   - **"price_level"**: Price-focused ("cheap", "budget", "affordable", "inexpensive", "low-cost", "expensive", "luxury")
   - **"general"**: Standard searches without specific emphasis

7. **sort_order**: Extract sorting preferences (use EXACT database function values):
   - **Proximity**: "nearest_first", "farthest_first"
   - **Rating**: "highest_first", "lowest_first"  
   - **Price**: "cheapest_first", "most_expensive_first"

8. **min_rating**: Quality threshold:
   - "best/excellent/top-rated/high-rating" = 4.0+, "good/well-rated" = 3.5+, "decent/okay" = 3.0+

9. **min_price_level** & **max_price_level**: Direct numeric price levels (1-4 scale):
   - **cheap/budget/affordable/inexpensive/low-cost**: min_price_level: 1, max_price_level: 1
   - **moderate/mid-range/reasonable**: min_price_level: 2, max_price_level: 2
   - **expensive/upscale/pricey**: min_price_level: 3, max_price_level: 3
   - **very expensive/premium/high-end/luxury**: min_price_level: 4, max_price_level: 4
   - **Budget to Moderate**: min_price_level: 1, max_price_level: 2
   - **Expensive range**: min_price_level: 3, max_price_level: 4
   - **All price levels**: min_price_level: 1, max_price_level: 4

10. **open_now**: true if "open now/today/currently open" mentioned.
11. **has_website**: true if online presence, booking, or website is important.
12. **has_phone**: true if contact information or phone is important.

13. **use_user_location**: true for user proximity queries ("near me", "around me", "within X distance from me").

14. **region**: Country code if mentioned (eg, "Ghana/Accra" = "GH", "United States/New York" = "US").
15. **type**: Google-compatible place type ("restaurant", "hospital", "cafe", "pharmacy").
16. **language**: Extract language preference if mentioned.
17. **min_price/max_price**: Numeric price levels (0-4 scale).
18. **opened_at**: Set if query includes time ("8pm" → "20:00", "morning" → "08:00", "afternoon" → "12:00", "evening" → "18:00", "night" → "22:00").
19. **tags**: Extract relevant tags from the main search term.

**CONVERSATION EXAMPLES:**

First query: "restaurants near Kotoka international airport"
→ {"query": "restaurants", "location": "Kotoka international airport", "category": "Food & Dining", "subcategory": "Restaurant", "search_type": "proximity", "radius_meters": 5000, "is_followup": false}

Follow-up: "Find me budget friendly ones and show them from cheapest to expensive" 
→ {"query": "budget friendly restaurants", "location": "Kotoka international airport", "search_type": "price_level", "min_price_level": 1, "max_price_level": 1, "sort_order": "cheapest_first", "radius_meters": 5000, "is_followup": true, "context_action": "refine"}

Follow-up: "What about hotels instead?"
→ {"query": "hotels", "location": "Kotoka international airport", "category": "Accommodation & Hospitality", "subcategory": "Hotel", "search_type": "proximity", "radius_meters": 5000, "is_followup": true, "context_action": "new_search"}

Follow-up: "Show me the highest rated ones first"
→ {"query": "hotels", "location": "Kotoka international airport", "search_type": "rating", "sort_order": "highest_first", "radius_meters": 5000, "is_followup": true, "context_action": "refine"}


**LOCATION CHANGE EXAMPLE:**
Previous context: Hotels near Kotoka international airport
New query: "24-hour pharmacies with parking nearby Achimota"
→ {"query": "24-hour pharmacies", "location": "Achimota", "features": ["24-hour", "parking"], "category": "Healthcare", "subcategory": "Pharmacy", "search_type": "proximity", "radius_meters": 5000, "open_now": true, "type": "pharmacy", "tags": ["pharmacy", "healthcare", "drug store", "parking"], "is_followup": false}
**Reasoning**: Different location (Achimota vs Kotoka) + different category (Healthcare vs Accommodation) = completely new search, not a follow-up.

**PRICE LEVEL EXAMPLES:**
"Show me expensive restaurants in Accra" →
{"query": "expensive restaurants", "location": "Accra", "category": "Food & Dining", "subcategory": "Restaurant", "search_type": "price_level", "min_price_level": 3, "max_price_level": 3, "radius_meters": 5000, "type": "restaurant", "tags": ["restaurant", "expensive", "food", "dining"], "is_followup": false}

"Find very expensive luxury hotels" →
{"query": "very expensive luxury hotels", "category": "Accommodation & Hospitality", "subcategory": "Hotel", "search_type": "price_level", "min_price_level": 4, "max_price_level": 4, "type": "lodging", "tags": ["hotel", "luxury", "very expensive", "accommodation"], "is_followup": false}

"Budget friendly cafes with wifi near me" →
{"query": "budget friendly cafes", "features": ["wifi"], "category": "Food & Dining", "subcategory": "Cafe", "search_type": "price_level", "min_price_level": 1, "max_price_level": 1, "radius_meters": 2000, "use_user_location": true, "type": "cafe", "tags": ["cafe", "budget", "wifi", "affordable"], "is_followup": false}

"Moderate price hotels in East Legon" →
{"query": "moderate price hotels", "location": "East Legon", "category": "Accommodation & Hospitality", "subcategory": "Hotel", "search_type": "price_level", "min_price_level": 2, "max_price_level": 2, "radius_meters": 5000, "type": "lodging", "tags": ["hotel", "moderate", "mid-range"], "is_followup": false}

"Show me budget to moderate restaurants sorted by price" →
{"query": "budget to moderate restaurants", "search_type": "price_level", "min_price_level": 1, "max_price_level": 2, "sort_order": "cheapest_first", "category": "Food & Dining", "subcategory": "Restaurant", "tags": ["restaurant", "budget", "moderate", "affordable"], "is_followup": false}

NB: Correct typos in queries. Always return valid JSON. Only include fields that can be confidently extracted.`;

const FOLLOWUP_DETECTION_PROMPT = `Analyze if this query is a follow-up to a previous search or a completely new search.

Look for indicators:
- **Follow-up signals**: "those", "them", "these", "the ones", "budget friendly ones", "show me", "filter by", "sort by", "instead", "what about", "also find", "now show me"
- **Refinement words**: "cheaper", "more expensive", "higher rated", "closer", "further", "with parking", "open now"
- **New search signals**: 
  * Completely different category/type of place
  * New location explicitly mentioned (different from previous context)
  * No reference words connecting to previous search
  * Different geographic area or city name

Return JSON with:
- is_followup: boolean
- context_action: "refine" | "filter" | "new_search"
- confidence: number (0-1)

Examples:
"Find me budget friendly ones" → {"is_followup": true, "context_action": "refine", "confidence": 0.9}
"What about hotels instead?" → {"is_followup": true, "context_action": "new_search", "confidence": 0.8}
"Show hospitals in Accra" → {"is_followup": false, "context_action": "new_search", "confidence": 0.9}
"24-hour pharmacies with parking nearby Achimota" → {"is_followup": false, "context_action": "new_search", "confidence": 0.95}`;

export async function parseNaturalLanguageQuery(
  naturalQuery: string,
  userLocation?: { lat: number; lng: number },
  conversationContext?: ConversationContext,
  defaultStructuredQuery?: StructuredSearchQuery
): Promise<StructuredSearchQuery> {
  try {
    // If a default structured query is provided, use it as the base and skip OpenAI for initial query
    if (defaultStructuredQuery && !conversationContext?.previousQuery) {
      // For the first query with a default, just return the default structured query
      return {
        ...defaultStructuredQuery,
        // Override with user location if provided
        ...(userLocation && { user_location: userLocation }),
      };
    }

    // First, determine if this is a follow-up query
    const isFollowup = conversationContext?.previousQuery
      ? await detectFollowup(naturalQuery)
      : { is_followup: false, context_action: 'new_search' as const };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: UNIFIED_SYSTEM_PROMPT,
        },
        ...(conversationContext?.previousQuery
          ? [
              {
                role: 'assistant' as const,
                content: `Previous search context: ${JSON.stringify(conversationContext.previousQuery)}`,
              },
            ]
          : []),
        {
          role: 'user',
          content: naturalQuery,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as UnifiedSearchOutput;
    console.log('Parsed query:', parsed);

    // Build structured query
    let structuredQuery: StructuredSearchQuery = {
      query: parsed.query || naturalQuery,
      ...(parsed.location && { location: parsed.location }),
      ...(parsed.features &&
        parsed.features.length > 0 && { features: parsed.features }),
      ...(parsed.category && { category: parsed.category }),
      ...(parsed.subcategory && { subcategory: parsed.subcategory }),
      ...(parsed.min_rating && { min_rating: parsed.min_rating }),
      ...(parsed.min_price_level && {
        min_price_level: parsed.min_price_level,
      }),
      ...(parsed.max_price_level && {
        max_price_level: parsed.max_price_level,
      }),
      ...(parsed.open_now && { open_now: parsed.open_now }),
      ...(parsed.has_website && { has_website: parsed.has_website }),
      ...(parsed.has_phone && { has_phone: parsed.has_phone }),
      ...(parsed.region && { region: parsed.region }),
      ...(parsed.language && { language: parsed.language }),
      ...(parsed.radius_meters && { radius_meters: parsed.radius_meters }),
      ...(parsed.search_type && { search_type: parsed.search_type }),
      ...(parsed.use_user_location &&
        userLocation && {
          user_location: userLocation,
          radius_meters: parsed.radius_meters || 5000,
        }),
      ...(parsed.tags && { tags: parsed.tags }),
      ...(parsed.sort_order && { sort_order: parsed.sort_order }),
    };

    // Handle follow-up logic
    if (isFollowup.is_followup && conversationContext?.previousQuery) {
      structuredQuery = mergeSearchQueries(
        conversationContext.previousQuery,
        structuredQuery,
        isFollowup.context_action
      );
    }

    return structuredQuery;
  } catch (error) {
    console.error('Error parsing natural language query:', error);
    return { query: naturalQuery };
  }
}

async function detectFollowup(query: string): Promise<{
  is_followup: boolean;
  context_action: 'refine' | 'filter' | 'new_search';
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: FOLLOWUP_DETECTION_PROMPT },
        { role: 'user', content: query },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      is_followup: result.is_followup || false,
      context_action: result.context_action || 'new_search',
    };
  } catch (error) {
    console.error('Error detecting follow-up:', error);
    return { is_followup: false, context_action: 'new_search' };
  }
}

function mergeSearchQueries(
  previousQuery: StructuredSearchQuery,
  newQuery: StructuredSearchQuery,
  action: 'refine' | 'filter' | 'new_search'
): StructuredSearchQuery {
  switch (action) {
    case 'new_search':
      // Different place type but preserve location context
      return {
        ...newQuery,
        // Always preserve location context unless explicitly overridden
        location: newQuery.location || previousQuery.location,
        radius_meters: newQuery.radius_meters || previousQuery.radius_meters,
        user_location: newQuery.user_location || previousQuery.user_location,
        region: newQuery.region || previousQuery.region,
        // If no search_type specified and we have location context, default to proximity
        search_type:
          newQuery.search_type ||
          (previousQuery.location || previousQuery.user_location
            ? 'proximity'
            : 'general'),
      };

    case 'refine':
      // Modify search parameters while preserving all context
      return {
        ...previousQuery,
        ...newQuery,
        // CRITICAL: Always preserve location context
        location: newQuery.location || previousQuery.location,
        radius_meters: newQuery.radius_meters || previousQuery.radius_meters,
        user_location: newQuery.user_location || previousQuery.user_location,
        region: newQuery.region || previousQuery.region,
        // Merge arrays instead of replacing
        features: [
          ...(previousQuery.features || []),
          ...(newQuery.features || []),
        ],
        tags: [...(previousQuery.tags || []), ...(newQuery.tags || [])],
      };

    case 'filter':
      // Add filters while preserving everything
      return {
        ...previousQuery,
        // Add new filters without losing context
        ...(newQuery.min_rating && { min_rating: newQuery.min_rating }),
        ...(newQuery.min_price_level && {
          min_price_level: newQuery.min_price_level,
        }),
        ...(newQuery.max_price_level && {
          max_price_level: newQuery.max_price_level,
        }),
        ...(newQuery.search_type && { search_type: newQuery.search_type }),
        ...(newQuery.open_now !== undefined && { open_now: newQuery.open_now }),
        ...(newQuery.features && {
          features: [...(previousQuery.features || []), ...newQuery.features],
        }),
        // Preserve location context (should never be lost in filter)
        location: previousQuery.location,
        radius_meters: previousQuery.radius_meters,
        user_location: previousQuery.user_location,
      };

    default:
      return newQuery;
  }
}

export function createConversationContext(
  previousQuery?: StructuredSearchQuery
): ConversationContext {
  return {
    previousQuery,
    searchHistory: previousQuery ? [previousQuery] : [],
  };
}

export function updateConversationContext(
  context: ConversationContext,
  newQuery: StructuredSearchQuery
): ConversationContext {
  return {
    previousQuery: newQuery,
    searchHistory: [...context.searchHistory, newQuery],
  };
}

export async function enhanceQueryWithContext(
  structuredQuery: StructuredSearchQuery,
  userLocation?: { lat: number; lng: number }
): Promise<StructuredSearchQuery> {
  if (!structuredQuery.location && userLocation) {
    return {
      ...structuredQuery,
      location: `${userLocation.lat},${userLocation.lng}`,
    };
  }
  return structuredQuery;
}

// Legacy compatibility functions
export const parseNaturalLanguageQueryForGoogleTextSearch =
  parseNaturalLanguageQuery;
export const parseNaturalLanguageQueryForTextSearch = parseNaturalLanguageQuery;
