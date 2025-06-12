import { NextRequest, NextResponse } from 'next/server';
import {
  searchPlaces,
  getPlaceDetails,
  getGooglePhotoUrl,
} from '@/lib/services/google-places';
import { transformGooglePlaceToLocalModel } from '@/lib/services/place-mapping';
import {
  FormattedGooglePlaceSearchResult,
  StructuredSearchQuery,
} from '@/types/search';

export async function POST(request: NextRequest) {
  try {
    const structuredQuery: StructuredSearchQuery = await request.json();

    if (!structuredQuery.query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Search for places using Google Places API
    const searchResults = await searchPlaces(structuredQuery);
    // console.log('searchResults from google places', searchResults);

    if (searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          places: [],
          total_results: 0,
          message: 'No places found for the given query',
        },
      });
    }

    const localPlaces: FormattedGooglePlaceSearchResult[] = searchResults.map(
      (place) => {
        const gallery = place.photos?.map((photo) =>
          getGooglePhotoUrl(photo.photo_reference, 800)
        );
        return {
          placeId: place.place_id,
          name: place.name,
          location: place.geometry.location,
          rating: place.rating,
          totalReviews: place.user_ratings_total,
          priceLevel: place.price_level,
          types: place.types,
          vicinity: place.vicinity,
          formattedAddress: place.formatted_address,
          openNow: place.open_now,
          gallery: gallery || [],
        };
      }
    );

    // Get detailed information for each place (limit to first 5 for performance)
    // const detailedPlaces = await Promise.allSettled(
    //   searchResults.slice(0, 5).map((place) => getPlaceDetails(place.place_id))
    // );
    // console.log('detailedPlaces from google places', detailedPlaces);

    // Filter successful results
    // const successfulDetails = detailedPlaces
    //   .filter(
    //     (result): result is PromiseFulfilledResult<any> =>
    //       result.status === 'fulfilled'
    //   )
    //   .map((result) => result.value);

    // Transform Google Places to local Place model
    // const transformedPlaces = await Promise.allSettled(
    //   successfulDetails.map((place) =>
    //     transformGooglePlaceToLocalModel(place, 'google-search')
    //   )
    // );

    // Filter successful transformations
    // const localPlaces = transformedPlaces
    //   .filter(
    //     (result): result is PromiseFulfilledResult<any> =>
    //       result.status === 'fulfilled'
    //   )
    //   .map((result) => result.value);

    return NextResponse.json({
      success: true,
      data: {
        places: localPlaces,
        total_results: localPlaces.length,
        original_query: structuredQuery,
        google_results_count: searchResults.length,
      },
    });
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
}
