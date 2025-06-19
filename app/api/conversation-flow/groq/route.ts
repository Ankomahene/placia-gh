import { NextRequest, NextResponse } from 'next/server';
import {
  processQueryWithGroq,
  clearGroqContext,
} from '@/lib/services/groq-conversation-flow';

export async function POST(request: NextRequest) {
  try {
    const { query, sessionId } = await request.json();

    if (!query || !sessionId) {
      return NextResponse.json(
        { error: 'Query and sessionId are required' },
        { status: 400 }
      );
    }

    const response = await processQueryWithGroq(sessionId, query);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error in Groq conversation flow:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation flow' },
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
