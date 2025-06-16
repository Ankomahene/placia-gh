import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery } from '@/lib/services/openai-search';
import { searchGooglePlaces } from '@/lib/services/google/places';

export async function POST(request: NextRequest) {
  try {
    const { query, userLocation } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Natural language query is required' },
        { status: 400 }
      );
    }

    // Parse natural language query using unified OpenAI parser
    const structuredQuery = await parseNaturalLanguageQuery(
      query,
      userLocation
    );

    // Search places using Google textSearch with structured query
    const places = await searchGooglePlaces(structuredQuery);

    return NextResponse.json({
      success: true,
      data: {
        places,
        total_results: places.length,
        structured_query: structuredQuery,
        original_query: query,
        source: 'google_places',
        user_location_used: !!userLocation,
        search_metadata: {
          has_distance_calculation: false,
          has_open_hours_check: false,
          features_searched: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error in Google textSearch:', error);
    return NextResponse.json(
      { error: 'Failed to search places with Google textSearch' },
      { status: 500 }
    );
  }
}
