import { NextRequest, NextResponse } from 'next/server';
import { smartPlaceSearch } from '@/lib/services/smart-search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      naturalQuery,
      userLocation,
      limit = 20,
      offset = 0,
      useConversationalSearch = false,
    } = body;

    // Validate required parameters
    if (!naturalQuery) {
      return NextResponse.json(
        {
          success: false,
          message: 'naturalQuery is required',
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Use conversational search or regular AI search
    const searchResult = useConversationalSearch
      ? await smartPlaceSearch.conversationalSearch({
          naturalQuery,
          userLocation,
          limit,
          offset,
        })
      : await smartPlaceSearch.searchWithAI({
          naturalQuery,
          userLocation,
          limit,
          offset,
        });

    const totalTime = Date.now() - startTime;

    console.log(
      `🚀 Smart search completed: "${naturalQuery}" - ${searchResult.count} results in ${totalTime}ms`
    );

    return NextResponse.json({
      success: true,
      message: 'Smart search completed successfully',
      data: {
        ...searchResult,
        metadata: {
          totalProcessingTime: totalTime,
          searchType: useConversationalSearch
            ? 'conversational'
            : 'enhanced_ai',
          userLocationUsed: !!userLocation,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('❌ Smart search failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Smart search failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check server logs for more information',
      },
      { status: 500 }
    );
  }
}

// GET method for simple testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const conversational = searchParams.get('conversational') === 'true';

  if (!query) {
    return NextResponse.json(
      {
        success: false,
        message: 'Query parameter "q" is required',
      },
      { status: 400 }
    );
  }

  try {
    const userLocation =
      lat && lng
        ? {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
          }
        : undefined;

    const searchResult = conversational
      ? await smartPlaceSearch.conversationalSearch({
          naturalQuery: query,
          userLocation,
          limit: 10,
        })
      : await smartPlaceSearch.searchWithAI({
          naturalQuery: query,
          userLocation,
          limit: 10,
        });

    return NextResponse.json({
      success: true,
      message: `Smart search test completed for: "${query}"`,
      data: {
        ...searchResult,
        testMode: true,
        searchQuery: query,
        locationProvided: !!userLocation,
      },
    });
  } catch (error) {
    console.error('❌ Smart search test failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Smart search test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
