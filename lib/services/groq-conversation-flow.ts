import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationFlowResponse {
  user_response: string;
  server_query: string;
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
}

export interface ChatContext {
  messages: ChatMessage[];
  lastSearchQuery?: string;
  lastSearchLocation?: string;
  lastSearchCategory?: string;
}

const GROQ_CONVERSATION_SYSTEM_PROMPT = `You are an intelligent search assistant that helps users find places and businesses in Ghana. Your job is to:

1. **Analyze if the current user query is a follow-up or a new search**
2. **Provide a natural, helpful response to the user**
3. **Generate a refined search query for server processing**

## FOLLOW-UP DETECTION RULES:

A query is a **follow-up** if:
- Uses reference words: "those", "them", "these", "ones", "it", "they" etc.
- Adds filters/preferences: "open late", "budget friendly", "with parking", "rooftop" etc.
- Uses transition cues: "what about", "instead", "also", "now show me", "how about" etc.
- Requests sorting: "show cheapest", "highest rated", "closest ones" etc.
- Modifies previous search: "but closer", "with better ratings", "that are cheaper" etc.

A query is a **new search** if:
- Mentions completely different place type AND location
- Starts unrelated topic
- No reference to previous context

## CLARIFICATION NEEDED:

A query **needs clarification** if:
- **Missing place type**: "Find me something nearby", "What's around here?"
- **Missing location**: "Find me restaurants" (no location specified)
- **Too vague**: "Show me places", "Find me stuff"
- **Ambiguous intent**: "Find me good things", "What do you recommend?"

For unclear queries, ask specific clarifying questions to help the user.

## RESPONSE GENERATION:

**For new searches:**
- User Response: Acknowledge the search request naturally
- Server Query: Use the original query

**For follow-ups:**
- User Response: Acknowledge the refinement/change
- Server Query: Combine previous context + new requirements (remove vague references)

**For clarification needed:**
- User Response: Ask specific clarifying questions
- Server Query: Leave as original query (won't be used until clarified)
- Set needs_clarification: true and appropriate clarification_type

## REFINEMENT LOGIC:

When refining follow-up queries:
- **ALWAYS include original place type** unless user explicitly changes category
- **ALWAYS include original location** unless user specifies new location  
- **Add new descriptors/filters** mentioned in follow-up
- **Remove vague references** like "those", "them", "ones"
- **Keep location context** from previous searches

Structure: [NEW DESCRIPTORS] + [PLACE TYPE] + [LOCATION] + [ADDITIONAL FILTERS]

## EXAMPLES:

**Example 1 - New Search:**
User: "Find me the best restaurants in Accra"
Previous: None
Response: {
  "user_response": "I'll help you find the best restaurants in Accra. Let me search for highly-rated dining options in the area.",
  "server_query": "best restaurants in Accra",
  "is_followup": false,
  "followup_type": "new_search",
  "confidence": 1.0
}

**Example 2 - Follow-up Refinement:**
User: "show me ones with rooftop seating"
Previous: "best restaurants in Accra"
Response: {
  "user_response": "Great! I'll find restaurants in Accra that have rooftop seating for you.",
  "server_query": "rooftop restaurants in Accra",
  "is_followup": true,
  "followup_type": "refinement",
  "confidence": 0.9
}

**Example 3 - Category Change:**
User: "what about hotels instead"
Previous: "best restaurants in Accra"
Response: {
  "user_response": "I'll switch to searching for hotels in Accra instead.",
  "server_query": "best hotels in Accra",
  "is_followup": true,
  "followup_type": "category_change",
  "confidence": 0.85,
  "needs_clarification": false
}

**Example 4 - Clarification Needed:**
User: "Find me something nearby"
Previous: None
Response: {
  "user_response": "I'd be happy to help you find places nearby! What type of place are you looking for? For example, restaurants, shops, hospitals, or something else?",
  "server_query": "Find me something nearby",
  "is_followup": false,
  "followup_type": "clarification_needed",
  "confidence": 0.95,
  "needs_clarification": true,
  "clarification_type": "missing_place_type"
}

**Example 5 - Missing Location:**
User: "Find me restaurants"
Previous: None
Response: {
  "user_response": "I'd love to help you find restaurants! Which area or city are you looking in? For example, Accra, Kumasi, or near your current location?",
  "server_query": "Find me restaurants",
  "is_followup": false,
  "followup_type": "clarification_needed",
  "confidence": 0.9,
  "needs_clarification": true,
  "clarification_type": "missing_location"
}

## IMPORTANT GUIDELINES:

- Keep user responses natural, helpful, and encouraging
- Always acknowledge what you're searching for
- Server queries should be complete and natural (no vague references)
- Maintain location context across follow-ups
- Be confident in your classifications
- If unsure about follow-up status, lean towards new search

NB: When the user requests for a location near them or around their current location, let them know the you will use their current location to search for places for them if their location is enabled or allowed.

Return response as JSON with all required fields.`;

export class GroqConversationFlow {
  private contexts: Map<string, ChatContext> = new Map();

  constructor() {}

  // Get or create chat context for a session
  getChatContext(sessionId: string): ChatContext {
    if (!this.contexts.has(sessionId)) {
      this.contexts.set(sessionId, {
        messages: [],
      });
    }
    return this.contexts.get(sessionId)!;
  }

  // Add message to chat context
  addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): void {
    const context = this.getChatContext(sessionId);
    context.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Keep only last 10 messages to avoid token limits
    if (context.messages.length > 10) {
      context.messages = context.messages.slice(-10);
    }
  }

  // Extract search context from previous messages
  private extractSearchContext(context: ChatContext): {
    lastQuery?: string;
    lastLocation?: string;
    lastCategory?: string;
  } {
    // Look through recent messages for search context
    const recentMessages = context.messages.slice(-6); // Last 6 messages

    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const message = recentMessages[i];
      if (message.role === 'user') {
        // Simple extraction - in a real implementation you might want more sophisticated parsing
        const content = message.content.toLowerCase();

        // Extract location indicators
        let location;
        const locationMatches = content.match(
          /(?:in|near|around|at)\s+([^,\s]+(?:\s+[^,\s]+)*)/i
        );
        if (locationMatches) {
          location = locationMatches[1];
        }

        // Extract place type/category
        let category;
        const placeTypes = [
          'restaurant',
          'hotel',
          'hospital',
          'school',
          'bank',
          'pharmacy',
          'church',
          'mosque',
          'shop',
          'bar',
          'cafe',
        ];
        for (const type of placeTypes) {
          if (content.includes(type)) {
            category = type;
            break;
          }
        }

        if (location || category) {
          return {
            lastQuery: message.content,
            lastLocation: location,
            lastCategory: category,
          };
        }
      }
    }

    return {};
  }

  // Main method to process user query and generate response
  async processQuery(
    sessionId: string,
    userQuery: string
  ): Promise<ConversationFlowResponse> {
    try {
      // Add user message to context
      this.addMessage(sessionId, 'user', userQuery);

      // Get chat context
      const context = this.getChatContext(sessionId);
      const searchContext = this.extractSearchContext(context);

      // Build conversation history for Groq
      const conversationHistory = context.messages
        .slice(-4) // Last 4 messages for context
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Create prompt with context
      const prompt = `
CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER QUERY: "${userQuery}"

PREVIOUS SEARCH CONTEXT:
${searchContext.lastQuery ? `Last Query: "${searchContext.lastQuery}"` : 'No previous search'}
${searchContext.lastLocation ? `Last Location: "${searchContext.lastLocation}"` : 'No location context'}
${searchContext.lastCategory ? `Last Category: "${searchContext.lastCategory}"` : 'No category context'}

Analyze the current query and provide a JSON response with user_response, server_query, is_followup, followup_type, confidence, needs_clarification, and clarification_type (if applicable).
`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: GROQ_CONVERSATION_SYSTEM_PROMPT,
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

      const response = JSON.parse(content) as ConversationFlowResponse;

      // Validate and ensure required fields
      if (!response.user_response) {
        response.user_response =
          "I'll help you search for that. Let me find what you're looking for.";
      }

      if (!response.server_query) {
        response.server_query = userQuery;
      }

      if (typeof response.is_followup !== 'boolean') {
        response.is_followup = false;
      }

      if (
        ![
          'refinement',
          'category_change',
          'new_search',
          'clarification_needed',
        ].includes(response.followup_type)
      ) {
        response.followup_type = response.is_followup
          ? 'refinement'
          : 'new_search';
      }

      if (
        typeof response.confidence !== 'number' ||
        response.confidence < 0 ||
        response.confidence > 1
      ) {
        response.confidence = 0.7;
      }

      if (typeof response.needs_clarification !== 'boolean') {
        response.needs_clarification =
          response.followup_type === 'clarification_needed';
      }

      // Validate clarification_type if needs_clarification is true
      if (response.needs_clarification && response.clarification_type) {
        const validTypes = [
          'missing_place_type',
          'missing_location',
          'too_vague',
          'ambiguous_intent',
        ];
        if (!validTypes.includes(response.clarification_type)) {
          response.clarification_type = 'too_vague';
        }
      }

      // Add assistant response to context
      this.addMessage(sessionId, 'assistant', response.user_response);

      // Update search context if this was a search query
      if (response.server_query && response.server_query !== userQuery) {
        context.lastSearchQuery = response.server_query;
      }

      return response;
    } catch (error) {
      console.error('Error processing query with Groq:', error);

      // Fallback response
      return {
        user_response:
          "I'll help you search for that. Let me find what you're looking for.",
        server_query: userQuery,
        is_followup: this.hasFollowupIndicators(userQuery),
        followup_type: this.hasFollowupIndicators(userQuery)
          ? 'refinement'
          : 'new_search',
        confidence: 0.5,
        needs_clarification: false,
      };
    }
  }

  // Simple heuristic fallback for follow-up detection
  private hasFollowupIndicators(query: string): boolean {
    const followupWords = [
      'those',
      'them',
      'these',
      'the ones',
      'it',
      'they',
      'budget friendly',
      'cheaper',
      'expensive',
      'highly rated',
      'what about',
      'instead',
      'also',
      'now show',
      'show me',
      'sort by',
      'order by',
      'from cheapest',
      'highest rated',
      'better ones',
      'closer ones',
      'with parking',
      'open late',
      'rooftop',
      'outdoor seating',
    ];

    const lowerQuery = query.toLowerCase();
    return followupWords.some((word) => lowerQuery.includes(word));
  }

  // Clear context for a session
  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }

  // Get conversation history for a session
  getConversationHistory(sessionId: string): ChatMessage[] {
    const context = this.getChatContext(sessionId);
    return [...context.messages];
  }
}

// Create singleton instance
export const groqConversationFlow = new GroqConversationFlow();

// Export convenience functions
export async function processQueryWithGroq(
  sessionId: string,
  userQuery: string
): Promise<ConversationFlowResponse> {
  return groqConversationFlow.processQuery(sessionId, userQuery);
}

export function addMessageToGroqContext(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): void {
  groqConversationFlow.addMessage(sessionId, role, content);
}

export function clearGroqContext(sessionId: string): void {
  groqConversationFlow.clearContext(sessionId);
}
