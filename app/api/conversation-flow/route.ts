import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversationFlow } from '@/lib/services/conversation-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentQuery, previousQuery } = body;

    if (!currentQuery || typeof currentQuery !== 'string') {
      return NextResponse.json(
        { error: 'Current query is required and must be a string' },
        { status: 400 }
      );
    }

    if (previousQuery && typeof previousQuery !== 'string') {
      return NextResponse.json(
        { error: 'Previous query must be a string if provided' },
        { status: 400 }
      );
    }

    // Analyze conversation flow using OpenAI
    const analysis = await analyzeConversationFlow(currentQuery, previousQuery);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error in conversation flow API:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze conversation flow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
