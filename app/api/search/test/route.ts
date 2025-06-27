import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery } from '@/lib/services';
import { StructuredSearchQuery } from '@/types/search';

// POST method for testing OpenAI parsing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { naturalQuery, userLocation, previousQuery } = body;

    if (!naturalQuery) {
      return NextResponse.json(
        {
          success: false,
          message: 'naturalQuery is required',
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Parse the natural language query
    const structuredQuery = await parseNaturalLanguageQuery(
      naturalQuery,
      userLocation
    );

    const processingTime = Date.now() - startTime;

    // Generate a conversational response based on the structured query
    const conversationalResponse = generateConversationalResponse(
      structuredQuery,
      naturalQuery
    );

    return NextResponse.json({
      success: true,
      data: {
        naturalQuery,
        structuredQuery,
        conversationalResponse,
        processingTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ OpenAI parsing test failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'OpenAI parsing test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET method for simple testing with query parameters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!query) {
    return NextResponse.json(
      {
        success: false,
        message: 'Query parameter "q" is required',
        example: '/api/search/test?q=restaurants near airport',
      },
      { status: 400 }
    );
  }

  try {
    const userLocation =
      lat && lng
        ? {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
          }
        : undefined;

    const startTime = Date.now();

    // Parse the natural language query
    const structuredQuery = await parseNaturalLanguageQuery(
      query,
      userLocation
    );

    const processingTime = Date.now() - startTime;

    // Generate a conversational response
    const conversationalResponse = generateConversationalResponse(
      structuredQuery,
      query
    );

    return NextResponse.json({
      success: true,
      message: `OpenAI parsing test completed for: "${query}"`,
      data: {
        naturalQuery: query,
        structuredQuery,
        conversationalResponse,
        processingTime,
        userLocationProvided: !!userLocation,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ OpenAI parsing test failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'OpenAI parsing test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: [
          'Check if OpenAI API key is configured',
          'Verify the query is in English',
          'Try a simpler query format',
        ],
      },
      { status: 500 }
    );
  }
}

function getPriceLevelCategory(minPrice?: number, maxPrice?: number): string {
  if (!minPrice && !maxPrice) return 'budget-friendly';

  const avgPrice =
    minPrice && maxPrice
      ? (minPrice + maxPrice) / 2
      : minPrice || maxPrice || 1;

  if (avgPrice <= 1.5) return 'budget-friendly';
  if (avgPrice <= 2.5) return 'moderate';
  if (avgPrice <= 3.5) return 'expensive';
  return 'very expensive';
}

function generateConversationalResponse(
  query: StructuredSearchQuery,
  originalQuery: string
): string {
  if (!query) {
    return "I'm having trouble understanding your request. Could you please rephrase it?";
  }

  const {
    search_type,
    location,
    min_rating,
    min_price_level,
    max_price_level,
    radius_meters,
  } = query;

  let response = 'Let me search for ';

  // Add the type of search
  switch (search_type) {
    case 'proximity':
      response += `places near ${location || 'your location'}`;
      if (radius_meters && radius_meters > 0) {
        const km = Math.round(radius_meters / 1000);
        response += ` within ${km}km`;
      }
      break;
    case 'rating':
      response += `highly rated places`;
      if (min_rating) {
        response += ` with ratings of ${min_rating}+ stars`;
      }
      break;
    case 'price_level':
      const priceCategory = getPriceLevelCategory(
        min_price_level,
        max_price_level
      );
      response += `${priceCategory} places`;
      break;
    default:
      response += `places matching "${originalQuery}"`;
  }

  if (location && search_type !== 'proximity') {
    response += ` in ${location}`;
  }

  response += '. Let me find the best options for you...';

  return response;
}
