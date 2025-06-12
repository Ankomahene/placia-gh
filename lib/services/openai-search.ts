import OpenAI from 'openai';
import { StructuredSearchQuery } from '@/types/search';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OpenAIStructuredOutput {
  query: string;
  location?: string;
  features?: string[];
  category?: string;
  subcategory?: string;
  radius_meters?: number;
  min_rating?: number;
  price_level?: 'budget' | 'moderate' | 'expensive' | 'very_expensive';
  open_now?: boolean;
  has_website?: boolean;
  has_phone?: boolean;
}

const SYSTEM_PROMPT = `You are a search query parser that converts natural language search queries into structured JSON format for finding places and businesses.

Extract the following information from user queries:
- query: The main search term (e.g., "coffee shop", "restaurant", "hospital")
- location: Specific location mentioned (e.g., "East Legon", "Accra", "near me")
- features: Specific features mentioned (e.g., "outdoor seating", "parking", "wheelchair accessible", "wifi")
- category: General category (e.g., "Food & Drink", "Healthcare", "Shopping", "Entertainment")
- subcategory: More specific category if identifiable
- radius_meters: Inferred search radius (default: 5000 for city areas, 1000 for specific neighborhoods)
- min_rating: Minimum rating if quality is mentioned (e.g., "best" = 4.0, "good" = 3.5)
- price_level: Budget level if mentioned ("cheap/budget" = budget, "expensive/upscale" = expensive)
- open_now: true if "open now" or similar is mentioned
- has_website: true if website/online presence is important
- has_phone: true if contact info is important

Examples:
"best coffee shops near East Legon with outdoor seating" → 
{
  "query": "coffee shop",
  "location": "East Legon",
  "features": ["outdoor seating"],
  "category": "Food & Drink",
  "subcategory": "Coffee Shop",
  "radius_meters": 3000,
  "min_rating": 4.0
}

"cheap restaurants in Accra that are open now" →
{
  "query": "restaurant",
  "location": "Accra",
  "category": "Food & Drink",
  "price_level": "budget",
  "open_now": true,
  "radius_meters": 5000
}

Always return valid JSON. If no specific location is mentioned, omit the location field.`;

export async function parseNaturalLanguageQuery(
  naturalQuery: string
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

    // cost: (completion.usage?.prompt_tokens || 0) * 0.00015/1000
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as OpenAIStructuredOutput;

    // Validate and clean the response
    const structuredQuery: StructuredSearchQuery = {
      query: parsed.query || naturalQuery,
      ...(parsed.location && { location: parsed.location }),
      ...(parsed.features &&
        parsed.features.length > 0 && { features: parsed.features }),
      ...(parsed.category && { category: parsed.category }),
      ...(parsed.subcategory && { subcategory: parsed.subcategory }),
      radius_meters: parsed.radius_meters || 5000,
      ...(parsed.min_rating && { min_rating: parsed.min_rating }),
      ...(parsed.price_level && { price_level: parsed.price_level }),
      ...(parsed.open_now && { open_now: parsed.open_now }),
      ...(parsed.has_website && { has_website: parsed.has_website }),
      ...(parsed.has_phone && { has_phone: parsed.has_phone }),
    };

    return structuredQuery;
  } catch (error) {
    console.error('Error parsing natural language query:', error);

    // Fallback: return a basic structured query
    return {
      query: naturalQuery,
      radius_meters: 5000,
    };
  }
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
