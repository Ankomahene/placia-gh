import { NextRequest, NextResponse } from 'next/server';
import {
  processQueryWithGroq,
  clearGroqContext,
} from '@/lib/services/groq-conversation-flow';

export async function POST(request: NextRequest) {
  try {
    const { query, sessionId } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const result = await processQueryWithGroq(sessionId, query);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Groq conversation flow API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during conversation processing.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId is required' },
        { status: 400 }
      );
    }

    clearGroqContext(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Conversation context cleared',
    });
  } catch (error) {
    console.error('Error clearing Groq conversation context:', error);
    return NextResponse.json(
      { error: 'Failed to clear conversation context' },
      { status: 500 }
    );
  }
}
