import { NextRequest, NextResponse } from 'next/server';
import { processConversationSearch } from '@/lib/services/groq-conversation-integration';

export async function POST(request: NextRequest) {
  try {
    const { query, sessionId, userLocation } = await request.json();

    if (!query || !sessionId) {
      return NextResponse.json(
        { error: 'Query and sessionId are required' },
        { status: 400 }
      );
    }

    const result = await processConversationSearch(
      sessionId,
      query,
      userLocation
    );

    return NextResponse.json({
      success: true,
      data: {
        user_response: result.user_response,
        is_followup: result.is_followup,
        followup_type: result.followup_type,
        confidence: result.confidence,
        needs_clarification: result.needs_clarification,
        clarification_type: result.clarification_type,
        raw_server_query: result.raw_server_query,
        // Only include structured_query if clarification is not needed
        ...(result.structured_query && {
          structured_query: result.structured_query,
        }),
      },
    });
  } catch (error) {
    console.error('Error in integrated conversation flow:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation and search' },
      { status: 500 }
    );
  }
}
