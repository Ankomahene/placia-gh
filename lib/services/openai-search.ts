import OpenAI from 'openai';
import { SearchType, StructuredSearchQuery } from '@/types/search';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SearchQueryOutput {
  query: string;
  location?: string;
  features?: string[];
  category?: string;
  subcategory?: string;
  radius_meters?: number;
  min_rating?: number;
  min_price_level?: number;
  max_price_level?: number;
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
  sort_order?: string;
}

const QUERY_PARSING_SYSTEM_PROMPT = `You are an intelligent search query parser that converts natural language search queries into structured JSON format for finding places and businesses in Ghana.

Extract the following information from user queries:

1. **query** (required): Main search term (e.g., "coffee shop", "best Italian restaurants").

2. **location**: Specific location mentioned (e.g., "East Legon", "Accra", "near Kotoka Airport").

3. **features**: Specific amenities (e.g., ["outdoor seating", "parking", "wifi", "24-hour"]).

4. **category**: General category (e.g., "Education", "Religion", "Finance", "Health", "Grooming & Personal Care", "Shopping & Commerce", "Food & Dining", "Accommodation & Hospitality", "Recreation & Entertainment", "Transportation & Travel", "Industry & Business", "Security & Safety", "Media & Communications", "Housing & Real Estate", "Nightlife & Social Spaces", "Air & Maritime", "Other").

5. **subcategory**: Specific type. Use explicit categories when mentioned (e.g., "Restaurant", "Hospital", "School", "Bank", etc). 
   Also infer from action verbs when place type is not directly stated: 
   - "eat", "grab food" → "Restaurant" or "Food Joint"
   - "shop", "buy" → "Shopping" or "Commerce"
   - "pray", "worship" → "Church" or "Mosque"
   - "study", "learn" → "School" or "Library"
   - "sleep", "stay" → "Hotel" or "Guest House"

6. **search_type** & **radius_meters**: Determine search intent and distance together:
   - **"proximity"**: Location-focused searches ("near me", "around", "close", "within X km/meters", "walking distance", etc.). 
     Set radius: 500-1000m (walking), 2000-5000m (nearby), 10000-25000m (city-wide)
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
   - **cheap/budget/affordable/inexpensive/low-cost**: min_price_level: 1, max_price_level: 2. sort_order: cheapest_first
   - **moderate/mid-range/reasonable**: min_price_level: 2, max_price_level: 2. sort_order: cheapest_first
   - **expensive/upscale/pricey**: min_price_level: 3, max_price_level: 4. sort_order: most_expensive_first
   - **very expensive/premium/high-end/luxury**: min_price_level: 4, max_price_level: 4. sort_order: most_expensive_first
   - **Budget to Moderate**: min_price_level: 1, max_price_level: 2. sort_order: cheapest_first
   - **Expensive range**: min_price_level: 3, max_price_level: 4. sort_order: most_expensive_first

10. **open_now**: true if "open now/today/currently open" mentioned.

11. **has_website**: true if online presence, booking, or website is important.

12. **has_phone**: true if contact information or phone is important.

13. **use_user_location**: true for user proximity queries ("near me", "around me", "within X distance from me", 'near or around user location').

14. **region**: Country code if mentioned (eg, "Ghana/Accra" = "GH", "United States/New York" = "US").

15. **type**: Google compatible place type ("restaurant", "hospital", "cafe", "pharmacy"). Always set the specific type based on what the user is looking for.

16. **language**: Extract language preference if mentioned.

17. **opened_at**: Set if query includes time ("8pm" → "20:00", "morning" → "08:00", "afternoon" → "12:00", "evening" → "18:00", "night" → "22:00").

18. **tags**: Extract relevant tags from the main search term.

**EXAMPLES:**

"Budget friendly restaurants near Kotoka international airport" →
{"query": "budget friendly restaurants", "location": "Kotoka international airport", "category": "Food & Dining", "subcategory": "Restaurant", "search_type": "price_level", "min_price_level": 1, "max_price_level": 1, "radius_meters": 5000, "type": "restaurant", "tags": ["restaurant", "budget", "affordable"]}

"Rooftop restaurants open late in Osu" →
{"query": "rooftop restaurants open late", "location": "Osu", "features": ["rooftop", "open late"], "category": "Food & Dining", "subcategory": "Restaurant", "search_type": "general", "type": "restaurant", "tags": ["restaurant", "rooftop", "late night"]}

"24-hour pharmacies with parking near me" →
{"query": "24-hour pharmacies", "features": ["24-hour", "parking"], "category": "Healthcare", "subcategory": "Pharmacy", "search_type": "proximity", "radius_meters": 2000, "use_user_location": true, "open_now": true, "type": "pharmacy", "tags": ["pharmacy", "24-hour", "parking"]}

**IMPORTANT:**
- Always return valid JSON
- Only include fields that can be confidently extracted
- Correct typos in queries
- Keep refined queries natural and conversational`;

export async function parseNaturalLanguageQuery(
  naturalQuery: string,
  userLocation?: { lat: number; lng: number },
  defaultStructuredQuery?: StructuredSearchQuery,
  useInitialQuery?: boolean
): Promise<StructuredSearchQuery> {
  try {
    // If a default structured query is provided, use it and skip OpenAI call
    if (defaultStructuredQuery) {
      console.log('Using pre-generated structured query, skipping OpenAI call');
      return {
        ...defaultStructuredQuery,
        // Only add user location if the query explicitly wants to use user location
        ...(defaultStructuredQuery.use_user_location &&
          userLocation && {
            user_location: userLocation,
          }),
      };
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: QUERY_PARSING_SYSTEM_PROMPT,
        },
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

    const parsed = JSON.parse(content) as SearchQueryOutput;

    // Build structured query
    const structuredQuery: StructuredSearchQuery = {
      query: useInitialQuery ? naturalQuery : parsed.query || naturalQuery,
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
          use_user_location: true,
          user_location: userLocation,
          radius_meters: parsed.radius_meters,
        }),
      ...(parsed.tags && { tags: parsed.tags }),
      ...(parsed.sort_order && { sort_order: parsed.sort_order }),
    };

    console.log('Structured query:', structuredQuery);

    return structuredQuery;
  } catch (error) {
    console.error('Error parsing natural language query:', error);
    return { query: naturalQuery };
  }
}

// Legacy compatibility functions (keeping for backward compatibility)
export const parseNaturalLanguageQueryForGoogleTextSearch =
  parseNaturalLanguageQuery;
export const parseNaturalLanguageQueryForTextSearch = parseNaturalLanguageQuery;
