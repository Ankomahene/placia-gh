import { NextResponse } from 'next/server';
import { googlePlaceSearch } from '@/lib/services/google/places';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseInt(searchParams.get('radius') || '5000', 10);
    const pageToken = searchParams.get('pageToken') || undefined;
    const address = searchParams.get('address') || undefined;

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'Invalid location coordinates' },
        { status: 400 }
      );
    }

    console.log('address', address);

    const { results, nextPageToken } = await googlePlaceSearch.search({
      naturalQuery: address ? `places nearby ${address}` : 'places nearby',
      userLocation: { lat, lng },
      pageToken,
      useCache: true,
      defaultStructuredQuery: {
        query: 'places nearby',
        search_type: 'proximity',
        sort_order: 'highest_first',
        min_rating: 3.5,
        radius_meters: radius,
        region: 'gh',
      },
    });

    return NextResponse.json({
      success: true,
      data: results.filter(
        (result) => result.distance && result.distance <= radius
      ),
      nextPageToken,
    });
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch nearby places' },
      { status: 500 }
    );
  }
}
