import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery } from '@/lib/services/openai-search';
import { searchPlaces, getPlaceDetails } from '@/lib/services/google-places';
import { transformGooglePlaceToLocalModel } from '@/lib/services/place-mapping';

export async function POST(request: NextRequest) {
  try {
    const { query, user_location } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Step 1: Parse natural language to structured query
    const structuredQuery = await parseNaturalLanguageQuery(query);

    // Step 2: Enhance with user location if provided
    if (user_location && !structuredQuery.location) {
      structuredQuery.location = `${user_location.lat},${user_location.lng}`;
    }

    // Step 3: Search Google Places
    const searchResults = await searchPlaces(structuredQuery);

    if (searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          places: [],
          total_results: 0,
          structured_query: structuredQuery,
          original_query: query,
          message: 'No places found for the given query',
        },
      });
    }

    // Step 4: Get detailed information for places (limit to first 5)
    const detailedPlaces = await Promise.allSettled(
      searchResults.slice(0, 5).map((place) => getPlaceDetails(place.place_id))
    );

    // Filter successful results
    const successfulDetails = detailedPlaces
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value);

    // Step 5: Transform to local Place model
    const transformedPlaces = await Promise.allSettled(
      successfulDetails.map((place) =>
        transformGooglePlaceToLocalModel(place, 'complete-search')
      )
    );

    // Filter successful transformations
    const localPlaces = transformedPlaces
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value);

    return NextResponse.json({
      success: true,
      data: {
        places: localPlaces,
        total_results: localPlaces.length,
        structured_query: structuredQuery,
        original_query: query,
        google_results_count: searchResults.length,
        processing_steps: {
          query_parsed: true,
          google_searched: true,
          details_fetched: successfulDetails.length,
          places_transformed: localPlaces.length,
        },
      },
    });
  } catch (error) {
    console.error('Error in complete search:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete search',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
