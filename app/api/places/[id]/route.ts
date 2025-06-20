import { NextRequest, NextResponse } from 'next/server';
import { getPlaceDetails } from '@/lib/services/google/places';
import { getInternalPlaceDetails } from '@/lib/services/internal/places';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') as 'google' | 'platform' | null;

    if (!id) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    if (!source || !['google', 'platform'].includes(source)) {
      return NextResponse.json(
        { error: 'Valid source parameter is required (google or platform)' },
        { status: 400 }
      );
    }

    let place;

    if (source === 'google') {
      place = await getPlaceDetails(id);
    } else if (source === 'platform') {
      place = await getInternalPlaceDetails(id);
    }

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      place,
      source,
    });
  } catch (error) {
    console.error('Error fetching place details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}
