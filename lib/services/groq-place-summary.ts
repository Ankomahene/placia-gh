import Groq from 'groq-sdk';
import { PlaceResults } from '@/types/place';
import { getPriceLevelLabel, getRatingLabel } from '../utils/place-utils';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PlaceSummaryResponse {
  summary: string;
  key_points: string[];
  suggested_questions: string[];
}

export interface PlaceQAResponse {
  answer: string;
  confidence: number;
  source_data: string[];
  suggested_followups: string[];
}

// Function to sanitize place data for Groq
function sanitizePlaceData(place: PlaceResults) {
  // Create a simpler, flatter structure
  return {
    name: place.name,
    description: place.description,
    tagline: place.tagline,
    category_name: place.category?.name,
    subcategory_name: place.subcategory?.name,
    type_name: place.type?.name,
    address: place.location?.street_address,
    city: place.city?.name,
    region: place.region?.name,
    country: place.country?.name,
    rating: place.rate_average,
    review_count: place.rate_count,
    rating_label: getRatingLabel(place.rate_average),
    price_level_label: getPriceLevelLabel(place.price_level),
    price_level: place.price_level,
    features: Array.isArray(place.features) ? place.features.join(', ') : '',
    services: Array.isArray(place.services) ? place.services.join(', ') : '',
    website: place.website,
    email: place.email,
    phone: place.international_phone_number,
    open_hours:
      typeof place.open_hours === 'string'
        ? place.open_hours
        : JSON.stringify(place.open_hours),
    open_now: place.open_now ? 'Yes' : 'No',
    tags: Array.isArray(place.tags) ? place.tags.join(', ') : '',
    accessibility: Array.isArray(place.accessibility)
      ? place.accessibility.join(', ')
      : '',
  };
}

const GROQ_PLACE_SYSTEM_PROMPT = `You are an intelligent assistant that helps users understand and learn more about places in Ghana. Your role is to:

1. Generate concise but informative summaries of places
2. Answer specific questions about places based on available data
3. Suggest relevant follow-up questions based on the place data

IMPORTANT: You must ALWAYS respond in valid JSON format.

When generating summaries:
- Focus on the most distinctive and important aspects
- Highlight unique features and offerings
- Include practical information (location, type, etc.)
- Keep it natural and engaging
- Suggest 3-5 follow-up questions users might want to ask based on provided place data

When answering questions:
- Be precise and factual based on the provided place data
- Cite specific details from the place data when relevant
- Acknowledge if certain information is not available
- Suggest related questions users might want to ask next
- Keep responses helpful but concise
- Always format your response as JSON

Always maintain a helpful, informative tone while focusing on accuracy.`;

export class GroqPlaceSummary {
  private contexts: Map<string, ChatMessage[]> = new Map();
  private placeData: any = null;

  constructor() {}

  private getContext(sessionId: string): ChatMessage[] {
    if (!this.contexts.has(sessionId)) {
      this.contexts.set(sessionId, []);
    }
    return this.contexts.get(sessionId)!;
  }

  private addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): void {
    const context = this.getContext(sessionId);
    context.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Keep only last 10 messages
    if (context.length > 10) {
      this.contexts.set(sessionId, context.slice(-10));
    }
  }

  async generateSummary(
    sessionId: string,
    place: PlaceResults
  ): Promise<PlaceSummaryResponse> {
    try {
      const sanitizedPlace = sanitizePlaceData(place);
      const prompt = `
Please analyze this place in Ghana and provide a summary. You must respond in JSON format.

PLACE INFORMATION:
${JSON.stringify(sanitizedPlace, null, 2)}

Generate a JSON response with exactly this structure:
{
  "summary": "A natural, engaging paragraph summarizing the place",
  "key_points": [
    "3-5 key points about the place"
  ],
  "suggested_questions": [
    "3 suggested questions users might want to ask"
  ]
}`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: GROQ_PLACE_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gemma2-9b-it',
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Groq');
      }

      const response = JSON.parse(content) as PlaceSummaryResponse;

      // Store the summary as context for future Q&A
      this.addMessage(sessionId, 'assistant', response.summary);

      return response;
    } catch (error) {
      console.error('Error generating place summary:', error);
      return {
        summary: 'Unable to generate summary at this time.',
        key_points: [],
        suggested_questions: [],
      };
    }
  }

  async answerQuestion(
    sessionId: string,
    place: PlaceResults,
    question: string
  ): Promise<PlaceQAResponse> {
    try {
      const context = this.getContext(sessionId);

      // Only include the last 3 messages for context
      const conversationHistory = context
        .slice(-3)
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Store place data in memory if not exists
      if (!this.placeData) {
        this.placeData = sanitizePlaceData(place);
      }

      const prompt = `
Answer the following question about this place. You must respond in JSON format.

PLACE INFORMATION:
${JSON.stringify(this.placeData, null, 2)}

RECENT CONVERSATION:
${conversationHistory}

QUESTION: "${question}"

Provide your response as a JSON object with exactly this structure:
{
  "answer": "Your clear and concise answer here",
  "suggested_followups": [
    "Question 1",
    "Question 2"
  ]
}`;

      const completion = await withRetry(() =>
        groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: GROQ_PLACE_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'gemma2-9b-it',
          temperature: 0.2,
          response_format: { type: 'json_object' },
        })
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Groq');
      }

      const response = JSON.parse(content);

      // Store the Q&A exchange in context
      this.addMessage(sessionId, 'user', question);
      this.addMessage(sessionId, 'assistant', response.answer);

      return {
        ...response,
        confidence: 1,
        source_data: [],
      };
    } catch (error) {
      console.error('Error answering place question:', error);
      return {
        answer:
          'Unable to answer the question at this time. Please try rephrasing your question.',
        confidence: 0,
        source_data: [],
        suggested_followups: [],
      };
    }
  }

  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
    this.placeData = null;
  }

  getConversationHistory(sessionId: string): ChatMessage[] {
    return [...this.getContext(sessionId)];
  }
}

// Create singleton instance
export const groqPlaceSummary = new GroqPlaceSummary();

// Export convenience functions
export async function generatePlaceSummary(
  sessionId: string,
  place: PlaceResults
): Promise<PlaceSummaryResponse> {
  return groqPlaceSummary.generateSummary(sessionId, place);
}

export async function answerPlaceQuestion(
  sessionId: string,
  place: PlaceResults,
  question: string
): Promise<PlaceQAResponse> {
  return groqPlaceSummary.answerQuestion(sessionId, place, question);
}

export function clearPlaceContext(sessionId: string): void {
  groqPlaceSummary.clearContext(sessionId);
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's not a 503 error
      if (error?.status !== 503) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying, with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}
