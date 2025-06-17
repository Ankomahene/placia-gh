import { NextResponse } from 'next/server';
import { googlePlaceSearch } from '@/lib/services/google/places';
import { smartPlaceSearch } from '@/lib/services/smart-search';
import { PlaceResultsSummary } from '@/types/place';
import { parseNaturalLanguageQuery } from '@/lib/services';

export async function POST(request: Request) {
  try {
    const {
      query,
      userLocation,
      googlePageToken,
      smartSearchOffset,
    }: {
      query: string;
      userLocation?: { lat: number; lng: number };
      googlePageToken?: string;
      smartSearchOffset?: number;
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const useGoogleCache = !!googlePageToken;
    const useSmartSearchCache = !!smartSearchOffset && smartSearchOffset > 0;

    const structuredQuery = await parseNaturalLanguageQuery(
      query,
      userLocation
    );

    // Run both searches in parallel
    const [googleResult, smartSearchResult] = await Promise.all([
      googlePlaceSearch.search({
        naturalQuery: query,
        userLocation,
        useCache: useGoogleCache,
        pageToken: googlePageToken,
        defaultStructuredQuery: structuredQuery,
      }),
      smartPlaceSearch.searchWithAI({
        naturalQuery: query,
        userLocation,
        useCache: useSmartSearchCache,
        offset: smartSearchOffset,
        defaultStructuredQuery: structuredQuery,
      }),
    ]);

    // Add source to each result
    const googlePlaces: PlaceResultsSummary[] = googleResult.success
      ? googleResult.results.map((p) => ({ ...p, source: 'google' }))
      : [];
    const smartPlaces: PlaceResultsSummary[] = smartSearchResult.success
      ? smartSearchResult.results.map((p) => ({ ...p, source: 'placia' }))
      : [];

    // Interleave the results for a better user experience
    const combinedResults: PlaceResultsSummary[] = [];
    let i = 0;
    let j = 0;
    while (i < smartPlaces.length || j < googlePlaces.length) {
      if (i < smartPlaces.length) {
        combinedResults.push(smartPlaces[i++]);
      }
      if (j < googlePlaces.length) {
        combinedResults.push(googlePlaces[j++]);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        places: combinedResults,
        nextGooglePageToken: googleResult.nextPageToken,
        nextSmartSearchOffset:
          smartSearchResult.pagination.hasMore && smartSearchResult.success
            ? smartSearchResult.pagination.offset +
              smartSearchResult.pagination.limit
            : null,
      },
    });
  } catch (error) {
    console.error('Combined search API error:', error);
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
