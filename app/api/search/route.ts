import { NextResponse } from 'next/server';
import { googlePlaceSearch } from '@/lib/services/google/places';
import { smartPlaceSearch } from '@/lib/services/smart-search';
import { PlaceResultsSummary } from '@/types/place';
import { parseNaturalLanguageQuery } from '@/lib/services';
import { searchContextCache } from '@/lib/services/search-context-cache';
import { StructuredSearchQuery } from '@/types/search';

export async function POST(request: Request) {
  try {
    const {
      query,
      userLocation,
      googlePageToken,
      smartSearchOffset,
      useInitialQuery,
      sessionId,
      defaultStructuredQuery,
    }: {
      query: string;
      userLocation?: { lat: number; lng: number };
      googlePageToken?: string;
      smartSearchOffset?: number;
      useInitialQuery?: boolean;
      sessionId?: string;
      defaultStructuredQuery?: StructuredSearchQuery;
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('search query: ', query);

    const useGoogleCache = !!googlePageToken;
    const useSmartSearchCache = !!smartSearchOffset && smartSearchOffset > 0;

    const structuredQuery = await parseNaturalLanguageQuery(
      query,
      userLocation,
      defaultStructuredQuery,
      useInitialQuery
    );

    // Cache the structured query for this session to improve future context extraction
    if (sessionId && structuredQuery) {
      searchContextCache.set(sessionId, {
        structuredQuery,
        timestamp: new Date(),
        originalQuery: query,
        userLocation,
      });
    }

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

    // Add source to each result but preserve the full search result structure
    const googleResultWithSource = {
      ...googleResult,
      results: googleResult.success
        ? googleResult.results.map((p) => ({ ...p, source: 'google' }))
        : [],
    };

    const smartSearchResultWithSource = {
      ...smartSearchResult,
      results: smartSearchResult.success
        ? smartSearchResult.results.map((p) => ({ ...p, source: 'placia' }))
        : [],
    };

    // Interleave and deduplicate the results for a better user experience
    const combinedPlaces: PlaceResultsSummary[] = [];
    const seenIds = new Set<string>();
    let i = 0;
    let j = 0;

    while (
      i < smartSearchResultWithSource.results.length ||
      j < googleResultWithSource.results.length
    ) {
      // Add from Placia (prioritize local data)
      if (i < smartSearchResultWithSource.results.length) {
        const place = smartSearchResultWithSource.results[i++];
        if (!seenIds.has(place.id)) {
          seenIds.add(place.id);
          combinedPlaces.push(place);
        }
      }

      // Add from Google (if not already added)
      if (j < googleResultWithSource.results.length) {
        const place = googleResultWithSource.results[j++];
        if (!seenIds.has(place.id)) {
          seenIds.add(place.id);
          combinedPlaces.push(place);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          places: combinedPlaces,
          googleSearchResult: googleResultWithSource,
          smartSearchResult: smartSearchResultWithSource,
          nextGooglePageToken: googleResultWithSource.nextPageToken || null,
          nextSmartSearchOffset: smartSearchResultWithSource.pagination?.hasMore
            ? (smartSearchOffset || 0) +
              combinedPlaces.filter((p) => p.source === 'placia').length
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    );
  }
}
