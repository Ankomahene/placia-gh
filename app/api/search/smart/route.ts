import { NextRequest, NextResponse } from 'next/server';
import { smartPlaceSearch } from '@/lib/services/smart-search';

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      userLocation,
      limit = 20,
      offset = 0,
      useCache = false,
    } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const result = await smartPlaceSearch.searchWithAI({
      naturalQuery: query,
      userLocation,
      limit,
      offset,
      useCache,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Smart search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
