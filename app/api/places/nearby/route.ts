import { NextResponse } from 'next/server';
import { transformGoogleSearchResultsToSummaries } from '@/lib/services/google/places';
import {
  Client,
  PlacesNearbyRanking,
} from '@googlemaps/google-maps-services-js';
import { GooglePlaceDetails } from '@/types/search';

export async function GET(request: Request) {
  const client = new Client({});
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;

  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }

  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseInt(searchParams.get('radius') || '5000', 10);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'Invalid location coordinates' },
        { status: 400 }
      );
    }

    const response = await client.placesNearby({
      params: {
        key: GOOGLE_API_KEY,
        location: `${lat},${lng}`,
        // radius: radius,
        rankby: 'distance' as PlacesNearbyRanking,
      },
    });

    const results = response.data.results || [];

    const summaries = transformGoogleSearchResultsToSummaries(
      results as GooglePlaceDetails[]
    );

    return NextResponse.json({
      success: true,
      data: summaries,
    });
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch nearby places' },
      { status: 500 }
    );
  }
}
