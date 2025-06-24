import { NextRequest } from 'next/server';
import {
  generatePlaceSummary,
  answerPlaceQuestion,
} from '@/lib/services/groq-place-summary';
import { PlaceResults } from '@/types/place';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sessionId, question, place } = await req.json();

    if (!sessionId) {
      return Response.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!place) {
      return Response.json(
        { error: 'Place data is required' },
        { status: 400 }
      );
    }

    // If question is provided, answer it, otherwise generate summary
    const response = question
      ? await answerPlaceQuestion(sessionId, place as PlaceResults, question)
      : await generatePlaceSummary(sessionId, place as PlaceResults);

    return Response.json(response);
  } catch (error) {
    console.error('Error in place summary API:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
