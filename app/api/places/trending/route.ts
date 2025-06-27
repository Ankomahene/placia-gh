import { NextResponse } from 'next/server';
import { googlePlaceSearch } from '@/lib/services/google/places';

export async function GET() {
  try {
    const { results } = await googlePlaceSearch.search({
      naturalQuery: 'popular trending places in ghana',
      useCache: true,
      defaultStructuredQuery: {
        query: 'popular trending places in ghana',
        search_type: 'rating',
        sort_order: 'highest_first',
        min_rating: 4.0,
        // radius_meters: 50000,
        region: 'gh',
      },
    });

    return NextResponse.json({
      success: true,
      data: results.slice(0, 10), // Limit to 10 trending places
    });
  } catch (error) {
    console.error('Error fetching trending places:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending places' },
      { status: 500 }
    );
  }
}
