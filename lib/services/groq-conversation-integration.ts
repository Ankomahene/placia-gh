import { processQueryWithGroq } from './groq-conversation-flow';
import { parseNaturalLanguageQuery } from './openai-search';
import { StructuredSearchQuery } from '@/types/search';

interface ConversationSearchResult {
  // User-facing response
  user_response: string;

  // Analysis data
  is_followup: boolean;
  followup_type:
    | 'refinement'
    | 'category_change'
    | 'new_search'
    | 'clarification_needed';
  confidence: number;
  needs_clarification: boolean;
  clarification_type?:
    | 'missing_place_type'
    | 'missing_location'
    | 'too_vague'
    | 'ambiguous_intent';

  // Search data
  structured_query?: StructuredSearchQuery; // Optional when clarification is needed
  raw_server_query: string;
}

/**
 * Complete conversation flow integration that:
 * 1. Uses Groq to analyze conversation context and generate responses
 * 2. Uses OpenAI to parse the refined query into structured search parameters
 * 3. Returns both user response and search-ready data
 */
export async function processConversationSearch(
  sessionId: string,
  userQuery: string,
  userLocation?: { lat: number; lng: number }
): Promise<ConversationSearchResult> {
  try {
    // Step 1: Process conversation flow with Groq
    const conversationFlow = await processQueryWithGroq(sessionId, userQuery);

    // Step 2: Only parse query if clarification is not needed
    let structuredQuery: StructuredSearchQuery | undefined;
    if (!conversationFlow.needs_clarification) {
      structuredQuery = await parseNaturalLanguageQuery(
        conversationFlow.server_query,
        userLocation
      );
    }

    return {
      user_response: conversationFlow.user_response,
      is_followup: conversationFlow.is_followup,
      followup_type: conversationFlow.followup_type,
      confidence: conversationFlow.confidence,
      needs_clarification: conversationFlow.needs_clarification,
      clarification_type: conversationFlow.clarification_type,
      structured_query: structuredQuery,
      raw_server_query: conversationFlow.server_query,
    };
  } catch (error) {
    console.error('Error in conversation search integration:', error);

    // Fallback: treat as new search with basic parsing
    const fallbackStructuredQuery = await parseNaturalLanguageQuery(
      userQuery,
      userLocation
    );

    return {
      user_response:
        "I'll help you search for that. Let me find what you're looking for.",
      is_followup: false,
      followup_type: 'new_search',
      confidence: 0.5,
      needs_clarification: false,
      structured_query: fallbackStructuredQuery,
      raw_server_query: userQuery,
    };
  }
}

/**
 * Example usage in your existing search components
 *
 * ```tsx
 * // In your search component or API route
 * const result = await processConversationSearch(
 *   sessionId,
 *   userQuery,
 *   userLocation
 * );
 *
 * // Show user the natural response
 * setUserFeedback(result.user_response);
 *
 * // Use structured query for actual search
 * const searchResults = await searchPlaces(result.structured_query);
 *
 * // Optional: Log analysis for debugging
 * console.log('Follow-up:', result.is_followup);
 * console.log('Type:', result.followup_type);
 * console.log('Confidence:', result.confidence);
 * console.log('Server Query:', result.raw_server_query);
 * ```
 */
