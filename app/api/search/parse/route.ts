import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery } from '@/lib/services/openai-search';
import { parseNaturalLanguageQueryForGoogleTextSearch } from '@/lib/services/openai-search-for-google';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // const structuredQuery = await parseNaturalLanguageQuery(query);
    const structuredQuery =
      await parseNaturalLanguageQueryForGoogleTextSearch(query);

    return NextResponse.json({
      success: true,
      data: structuredQuery,
    });
  } catch (error) {
    console.error('Error parsing query:', error);
    return NextResponse.json(
      { error: 'Failed to parse query' },
      { status: 500 }
    );
  }
}
