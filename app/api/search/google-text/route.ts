import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQueryForGoogleTextSearch } from '@/lib/services/openai-search-for-google';
import { searchPlacesWithTextSearch } from '@/lib/services/google-places';

export async function POST(request: NextRequest) {
  try {
    const { query, userLocation } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Natural language query is required' },
        { status: 400 }
      );
    }

    // Parse natural language query using enhanced OpenAI parser
    const structuredQuery = await parseNaturalLanguageQueryForGoogleTextSearch(
      query,
      userLocation
    );

    console.log('--------------------------------');
    console.log('structuredQuery', structuredQuery);

    // Search places using Google textSearch with structured query
    const places = await searchPlacesWithTextSearch(structuredQuery);

    return NextResponse.json({
      success: true,
      data: {
        places,
        total_results: places.length,
        structured_query: structuredQuery,
        original_query: query,
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
