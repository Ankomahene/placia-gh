import { NextRequest, NextResponse } from 'next/server';
import { parseNaturalLanguageQuery } from '@/lib/services/openai-search';

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          details:
            'OPENAI_API_KEY environment variable is missing. Please configure it in your .env file.',
          setup_instructions:
            'Add OPENAI_API_KEY=your_api_key_here to your .env.local file',
        },
        { status: 500 }
      );
    }

    // Parse request body with better error handling
    let body;
    try {
      const rawBody = await request.text();

      if (!rawBody.trim()) {
        return NextResponse.json(
          {
            error: 'Empty request body',
            details: 'Request body is empty or contains only whitespace',
          },
          { status: 400 }
        );
      }

      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          details:
            parseError instanceof Error
              ? parseError.message
              : 'Unknown parsing error',
          received_length: request.headers.get('content-length') || 'unknown',
        },
        { status: 400 }
      );
    }

    const { query, userLocation } = body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          error: 'Natural language query is required',
          details: 'Query must be a non-empty string',
          received: { query, type: typeof query },
        },
        { status: 400 }
      );
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Query cannot be empty',
          details: 'Please provide a meaningful search query',
        },
        { status: 400 }
      );
    }

    // Validate user location if provided
    if (userLocation && (!userLocation.lat || !userLocation.lng)) {
      return NextResponse.json(
        {
          error: 'Invalid user location',
          details: 'User location must include valid lat and lng coordinates',
          received: userLocation,
        },
        { status: 400 }
      );
    }

    const structuredQuery = await parseNaturalLanguageQuery(
      query.trim(),
      userLocation
    );

    return NextResponse.json({
      success: true,
      data: {
        original_query: query,
        structured_query: structuredQuery,
        user_location_used: !!userLocation,
        parsing_metadata: {
          has_location: !!structuredQuery.location,
          has_category: !!structuredQuery.category,
          has_features: !!(
            structuredQuery.features && structuredQuery.features.length > 0
          ),
          has_rating_filter: !!structuredQuery.min_rating,
          has_price_filter: !!structuredQuery.price_level,
          detected_radius: structuredQuery.radius_meters,
          open_now_filter: structuredQuery.open_now,
        },
      },
    });
  } catch (error) {
    console.error('Error parsing natural language query:', error);

    // Provide detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name || 'UnknownError',
    };

    // Check for specific OpenAI errors
    let userFriendlyError = 'Failed to parse natural language query';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        userFriendlyError = 'OpenAI API key is invalid or missing';
        statusCode = 500;
      } else if (error.message.includes('quota')) {
        userFriendlyError = 'OpenAI API quota exceeded';
        statusCode = 429;
      } else if (error.message.includes('rate limit')) {
        userFriendlyError = 'OpenAI API rate limit exceeded';
        statusCode = 429;
      } else if (
        error.message.includes('network') ||
        error.message.includes('fetch')
      ) {
        userFriendlyError = 'Network error connecting to OpenAI API';
        statusCode = 503;
      }
    }

    return NextResponse.json(
      {
        error: userFriendlyError,
        details: errorDetails.message,
        error_type: errorDetails.type,
        debug_info:
          process.env.NODE_ENV === 'development'
            ? {
                stack: errorDetails.stack,
                openai_configured: !!process.env.OPENAI_API_KEY,
                node_env: process.env.NODE_ENV,
              }
            : undefined,
      },
      { status: statusCode }
    );
  }
}
