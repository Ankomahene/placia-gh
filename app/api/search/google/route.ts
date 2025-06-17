import { NextRequest, NextResponse } from 'next/server';
import { googlePlaceSearch } from '@/lib/services/google/places';

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      userLocation,
      pageToken,
    }: {
      query: string;
      userLocation?: { lat: number; lng: number };
      pageToken?: string;
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const useCache = !!pageToken;

    const searchResult = await googlePlaceSearch.search({
      naturalQuery: query,
      userLocation,
      useCache,
      pageToken,
    });

    if (!searchResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        places: searchResult.results,
        total_results: searchResult.results.length,
        nextPageToken: searchResult.nextPageToken,
        structured_query: googlePlaceSearch.lastStructuredQuery,
        original_query: query,
        source: 'google-places-api',
        user_location_used: !!userLocation,
        search_metadata: {
          has_distance_calculation:
            'distance' in (searchResult.results[0] || {}),
          has_open_hours_check: 'open_now' in (searchResult.results[0] || {}),
          features_searched:
            googlePlaceSearch.lastStructuredQuery?.features?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error('Google search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during the search.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
