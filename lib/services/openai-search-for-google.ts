import OpenAI from 'openai';
import { StructuredSearchQuery } from '@/types/search';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GoogleTextSearchOutput {
  query: string;
  location?: string; // For LatLng format like "lat,lng"
  region?: string; // Country code like "GH", "US"
  radius?: number; // In meters, max 50000
  minprice?: number; // 0-4 scale
  maxprice?: number; // 0-4 scale
  opennow?: boolean;
  type?: string; // PlaceType1 like "restaurant", "hospital"
  language?: string; // Language code like "en", "fr"
  use_user_location?: boolean;
}

const SYSTEM_PROMPT = `You are an intelligent query parser designed to convert user-generated natural language search queries into structured parameters optimized for Google Places API's textSearch() method.

Extract the following information from user queries:

1. **query** (required): The main search text that best represents what the user is looking for. This should be natural and descriptive (e.g., "best Italian restaurants", "24-hour pharmacies", "coffee shops with wifi").

2. **location** : If a specific location is mentioned, extract it. For coordinates, format as "lat,lng". For place names, keep as text (e.g., "Accra", "East Legon", "New York").

3. **region** : Extract country/region code if mentioned or can be inferred from location (e.g., "GH" for Ghana, "US" for United States, "UK" for United Kingdom).

5. **minprice/maxprice** (optional): Extract price level (0-4 scale):

   - "cheap", "budget", "affordable" = maxprice: 1
   - "expensive", "upscale", "luxury" = minprice: 3
   - "moderate", "mid-range" = minprice: 1, maxprice: 3

6. **opennow** (optional): Set to true if "open now", "currently open", "open today" is mentioned.

7. **type**: Extract specific place type if mentioned:
   - "restaurant", "hospital", "school", "bank", "gas_station", "pharmacy", "store", "tourist_attraction", etc.

8. **language** (optional): Extract language preference if mentioned (e.g., "en", "fr", "es").

9. Set 'use_user_location: true' ONLY if the query explicitly references the user’s current position with phrases like:
   - 'near me', 'around me', 'close to me', 'near my location', 'current location', 'in my area', 'where I am', etc.
   - Proximity phrases like:
   - 'nearby', 'close to', 'around', 'within X km', 'close by',  'around my location', 'close to where I am', 'close to my current location',  'near this area', 'near here', 'around here', 'close to here', 'from here', 'within walking distance', 'within driving distance', 'within a certain distance', 'within X km from me', 'within X miles from me', 'locally', 'my neighborhood', 'in my vicinity', 'around my vicinity', 'close to home', 'right here', 'where I am', 'someplace close', 'somewhere close', 'nearby options', 'within range', 'any place near me', 'places I can reach easily'
   → These ONLY imply 'use_user_location: true' if there is **no specific place or city mentioned** in the query.
   - If a specific city, place, or landmark is named (e.g., "Cape Coast", "Accra Mall", "airport"), assume the proximity refers to **that location**, not the user.

10. **radius** (optional): Radius expressions (normalize all to meters):
   - within 5km → 5000
   - within 2000m → 2000
   - within 3 miles → 4828
**Common units to handle**:
   - m, meters → multiply by 1
   - km, kilometers → multiply by 1000
   - mi, miles → multiply by 1609.34
Default radius to 5000 if use_user_location is true but no radius is specified.

11. min_rating: Minimum rating if quality is mentioned (e.g., "best" = 4.0, "good" = 3.5)

Examples:
"best Italian restaurants in Accra open now" →
{
  "query": "best Italian restaurants",
  "location": "Accra",
  "region": "GH",
  "type": "restaurant",
  "opennow": true,
  "min_rating": 4.0,
}

"cheap hotels near me within 2km" →
{
  "query": "cheap hotels",
  "type": "lodging",
  "radius": 2000,
  "maxprice": 1,
  "use_user_location": true,
  "radius": 2000
}

"luxury shopping malls in Dubai" →
{
  "query": "luxury shopping malls",
  "location": "Dubai",
  "region": "AE",
  "type": "shopping_mall",
  "minprice": 3
}

Always return valid JSON. Only include fields that can be confidently extracted from the query.`;

export async function parseNaturalLanguageQueryForGoogleTextSearch(
  naturalQuery: string,
  userLocation?: { lat: number; lng: number }
): Promise<StructuredSearchQuery> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
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

    console.log('content', content);
    const parsed = JSON.parse(content) as GoogleTextSearchOutput;

    // Map to StructuredSearchQuery format
    const structuredQuery: StructuredSearchQuery = {
      query: parsed.query || naturalQuery,
      ...(parsed.location && { location: parsed.location }),
      ...(parsed.region && { region: parsed.region }),
      ...(parsed.radius && { radius_meters: parsed.radius }),
      ...(parsed.minprice !== undefined && { min_price: parsed.minprice }),
      ...(parsed.maxprice !== undefined && { max_price: parsed.maxprice }),
      ...(parsed.opennow && { open_now: parsed.opennow }),
      ...(parsed.type && { category: parsed.type }),
      ...(parsed.language && { language: parsed.language }),
      ...(parsed.use_user_location &&
        userLocation && {
          user_location: userLocation,
          radius_meters: parsed.radius || 1000,
        }),
    };

    return structuredQuery;
  } catch (error) {
    console.error(
      'Error parsing natural language query for Google textSearch:',
      error
    );

    // Fallback: return a basic structured query
    return {
      query: naturalQuery,
    };
  }
}

// Legacy function for backwards compatibility
export async function parseNaturalLanguageQuery(
  naturalQuery: string
): Promise<StructuredSearchQuery> {
  return parseNaturalLanguageQueryForGoogleTextSearch(naturalQuery);
}

export async function parseNaturalLanguageQueryForTextSearch(
  naturalQuery: string
): Promise<StructuredSearchQuery> {
  return {
    query: naturalQuery,
  };
}

export async function enhanceQueryWithContext(
  structuredQuery: StructuredSearchQuery,
  userLocation?: { lat: number; lng: number }
): Promise<StructuredSearchQuery> {
  // If no location specified but user location available, use it
  if (!structuredQuery.location && userLocation) {
    return {
      ...structuredQuery,
      location: `${userLocation.lat},${userLocation.lng}`,
    };
  }

  return structuredQuery;
}
