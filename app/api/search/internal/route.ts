import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery } from '@/lib/services/openai-search';
import { searchInternalPlaces } from '@/lib/services/internal/places';

export async function POST(request: NextRequest) {
  try {
    // Parse request body with better error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          details:
            parseError instanceof Error
              ? parseError.message
              : 'Unknown parsing error',
        },
        { status: 400 }
      );
    }

    const { query, userLocation, options = {} } = body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          error: 'Natural language query is required',
          details: 'Query must be a non-empty string',
          received: { query, type: typeof query },
        },
        { status: 400 }
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Query cannot be empty',
          details: 'Please provide a meaningful search query',
        },
        { status: 400 }
      );
    }

    // Parse natural language query using unified OpenAI parser
    const structuredQuery = await parseNaturalLanguageQuery(
      query.trim(),
      userLocation
    );

    // Merge any additional options
    const finalQuery = {
      ...structuredQuery,
      ...options,
    };

    // Search places using internal database
    const places = await searchInternalPlaces(finalQuery);

    return NextResponse.json({
      success: true,
      data: {
        places,
        total_results: places.length,
        structured_query: finalQuery,
        original_query: query,
        source: 'internal',
        user_location_used: !!userLocation,
        search_metadata: {
          has_distance_calculation: places.some(
            (place) => place.distance !== undefined
          ),
          has_open_hours_check: places.some(
            (place) => place.open_now !== undefined
          ),
          features_searched: finalQuery.features?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error in internal places search:', error);

    // Provide detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name || 'UnknownError',
    };

    return NextResponse.json(
      {
        error: 'Failed to search internal places',
        details: errorDetails.message,
        debug_info:
          process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
