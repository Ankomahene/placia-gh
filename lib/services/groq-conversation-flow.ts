import Groq from 'groq-sdk';
import {
  searchContextCache,
  CachedSearchContext,
} from './search-context-cache';

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
    | 'ambiguous_intent'
    | 'location_permission'
    | 'missing_reference_location'
    | 'greeting'
    | 'current_location_query';
  show_user_location?: boolean;
  requesting_location_permission?: boolean;
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

## ENHANCED CONTEXT AWARENESS:

You now have access to AI-generated context from previous searches including:
- **Structured location data** (not just basic regex matches)
- **Detailed feature lists** from previous searches
- **Exact price ranges and ratings** that were searched
- **Search type and intent** from previous queries
- **Distance specifications** with precise radius values

Use this rich context to make intelligent decisions about follow-ups and query refinement.

## FOLLOW-UP DETECTION RULES:

A query is a **follow-up** if:
- Uses reference words: "those", "them", "these", "ones", "it", "they" etc.
- Adds filters/preferences: "open late", "budget friendly", "with parking", "rooftop" etc.
- Uses transition cues: "what about", "instead", "also", "now show me", "how about" etc.
- Requests sorting: "show cheapest", "highest rated", "closest ones" etc.
- Modifies previous search: "but closer", "with better ratings", "that are cheaper" etc.
- Adds distance/radius specifications: "within 500m", "2km radius", "closer than 1km" etc.

A query is a **new search** if:
- Mentions completely different place type AND location
- Starts unrelated topic
- No reference to previous context

## DISTANCE/RADIUS HANDLING:

**CRITICAL**: Always preserve distance/radius specifications in server queries:
- **Distance formats**: "500m", "2km", "1.5 kilometers", "within 500 meters", "2km radius", "closer than 1km"
- **Proximity terms**: "within", "radius", "closer than", "further than", "around", "nearby"
- **Distance units**: meters (m), kilometers (km), miles (mi), feet (ft)

When user specifies distance:
- **ALWAYS include the exact distance** in the server_query
- **Preserve the distance format** used by the user (e.g., "500m" not "500 meters")
- **Keep proximity context** even in follow-ups
- **Combine with location** properly (e.g., "restaurants within 2km of Accra Mall")

## INTELLIGENT CONTEXT PRESERVATION:

When you have detailed previous context, intelligently preserve relevant aspects:
- **Location**: Use exact location from structured data (e.g., "East Legon", "Kotoka International Airport")
- **Features**: Maintain specific features like "rooftop", "parking", "outdoor seating"
- **Price Range**: Preserve budget constraints ("Budget", "Expensive", "Level 2-3")
- **Quality Filters**: Keep rating requirements ("4+ stars", "highly rated")
- **Search Intent**: Maintain search type (proximity, rating, price_level)
- **Special Requirements**: Preserve "open now", "has website", "has phone"

## CLARIFICATION NEEDED:

A query **needs clarification** if:
- **Missing place type**: "Find me something nearby", "What's around here?"
- **Missing location**: "Find me restaurants" (no location specified)
- **Too vague**: "Show me places", "Find me stuff"
- **Location permission**: "Find me places near me", "Find me places around me"
- **Ambiguous intent**: "Find me good things", "What do you recommend?"
- **Missing reference location**: "Find restaurants within 2km" (distance specified but no reference point)
- **Greeting statements**: When user starts with greetings like "hello", "hi", "hey", "good morning" etc., respond warmly and ask what they'd like to search for
- **Current location queries**: When user asks about their current location (e.g. "where am I?", "what's my location?"). 
  If they don't specify what places to find around them, set needs_clarification to true and clarification_type to 'current_location_query' and show_user_location to true.
  If they specify what places to find around them, set needs_clarification to false and show_user_location to true.

For unclear queries, ask specific clarifying questions to help the user.

## RESPONSE GENERATION:

**For new searches:**
- User Response: Acknowledge the search request naturally
- Server Query: Use the original query

**For follow-ups:**
- User Response: Acknowledge the refinement/change
- Server Query: Combine previous context + new requirements (remove vague references)

**For clarification needed:**
- User Response: Ask specific clarifying or permission requested
- Server Query: Leave as original query (won't be used until clarified)
- Set needs_clarification: true and set appropriate clarification_type eg. missing_place_type, missing_location, too_vague, ambiguous_intent, location_permission, missing_reference_location, greeting

## REFINEMENT LOGIC:

When refining follow-up queries:
- **ALWAYS include original place type** unless user explicitly changes category
- **ALWAYS include original location** unless user specifies new location  
- **ALWAYS preserve distance/radius** from previous search unless user specifies new distance
- **PRESERVE detailed features** from structured context when relevant
- **MAINTAIN price and rating filters** unless user changes them
- **Add new descriptors/filters** mentioned in follow-up
- **Remove vague references** like "those", "them", "ones"
- **Keep location context** from previous searches
- **Prioritize new distance** if user specifies different radius/proximity

Structure: [NEW DESCRIPTORS] + [PLACE TYPE] + [LOCATION] + [DISTANCE/RADIUS] + [PRESERVED FEATURES] + [ADDITIONAL FILTERS]

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

**Example 6 - Distance Specification:**
User: "Find restaurants within 2km of Accra Mall"
Previous: None
Response: {
  "user_response": "I'll search for restaurants within 2km of Accra Mall for you.",
  "server_query": "restaurants within 2km of Accra Mall",
  "is_followup": false,
  "followup_type": "new_search",
  "confidence": 0.95,
  "needs_clarification": false
}

**Example 7 - Follow-up with Distance:**
User: "show me ones with outdoor seating"
Previous: "restaurants within 2km of Accra Mall"
Response: {
  "user_response": "I'll find restaurants with outdoor seating within 2km of Accra Mall.",
  "server_query": "restaurants with outdoor seating within 2km of Accra Mall",
  "is_followup": true,
  "followup_type": "refinement",
  "confidence": 0.9,
  "needs_clarification": false
}

**Example 8 - Changing Distance:**
User: "make it 500m instead"
Previous: "restaurants within 2km of Accra Mall"
Response: {
  "user_response": "I'll narrow the search to restaurants within 500m of Accra Mall.",
  "server_query": "restaurants within 500m of Accra Mall",
  "is_followup": true,
  "followup_type": "refinement",
  "confidence": 0.95,
  "needs_clarification": false
}

**Example 9 - Current Location Query (Initial Request):**
User: "What is my current location?"
Previous: None
Response: {
  "user_response": "I can help you with that! To show you your current location, I need permission to access your location. Would you like to allow me to do so?",
  "server_query": "what is my current location",
  "is_followup": false,
  "followup_type": "clarification_needed",
  "confidence": 0.95,
  "needs_clarification": true,
  "clarification_type": "location_permission",
  "requesting_location_permission": true
}

**Example 10 - Current Location Query (After Permission):**
User: "yes"
Previous: "What is my current location?"
Response: {
  "user_response": "Here is your current location.",
  "server_query": "",
  "is_followup": true,
  "followup_type": "refinement",
  "confidence": 0.95,
  "needs_clarification": true,
  "clarification_type": "current_location_query",
  "show_user_location": true
}

  **Example 11 - Show Current Location again:**
User: "show me my current location again"
Previous: "Here is your current location."
Response: {
  "user_response": "Here is your current location again.",
  "server_query": "",
  "is_followup": true,
  "followup_type": "refinement",
  "confidence": 0.95,
  "needs_clarification": true,
  "clarification_type": "current_location_query",
  "show_user_location": true
}

## IMPORTANT GUIDELINES:

- Keep user responses natural, helpful, and encouraging
- Always acknowledge what you're searching for
- Server queries should be complete and natural (no vague references)
- **ALWAYS preserve distance/radius specifications** in server queries
- Maintain location context across follow-ups
- **Include distance context** when present in previous searches
- Be confident in your classifications
- If unsure about follow-up status, lean towards new search
- If the user asks to show their current location or show current location again, always set show_user_location to true and needs_clarification to false.

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

  // Extract search context using AI-powered cached structured queries
  private extractSearchContext(sessionId: string): {
    lastQuery?: string;
    lastLocation?: string;
    lastCategory?: string;
    lastDistance?: string;
    cachedContext?: CachedSearchContext;
    detailedContext?: {
      searchType?: string;
      features?: string[];
      priceRange?: string;
      ratingFilter?: number;
      openNow?: boolean;
      userLocationSearch?: boolean;
      subcategory?: string;
      hasWebsite?: boolean;
      hasPhone?: boolean;
    };
  } {
    // Try to get AI-generated context from cache first
    const cachedContext = searchContextCache.get(sessionId);

    if (cachedContext && cachedContext.structuredQuery) {
      const sq = cachedContext.structuredQuery;

      // Format distance appropriately
      let distance: string | undefined;
      if (sq.radius_meters) {
        if (sq.radius_meters >= 1000) {
          distance = `${(sq.radius_meters / 1000).toFixed(1)}km`;
        } else {
          distance = `${sq.radius_meters}m`;
        }
      }

      // Format price range
      let priceRange: string | undefined;
      if (sq.min_price_level || sq.max_price_level) {
        const min = sq.min_price_level || 1;
        const max = sq.max_price_level || 4;
        if (min === max) {
          const levels = ['', 'Budget', 'Moderate', 'Expensive', 'Luxury'];
          priceRange = levels[min];
        } else {
          priceRange = `Level ${min}-${max}`;
        }
      }

      return {
        lastQuery: cachedContext.originalQuery,
        lastLocation: sq.location,
        lastCategory: sq.category || sq.subcategory,
        lastDistance: distance,
        cachedContext,
        detailedContext: {
          searchType: sq.search_type,
          features: sq.features,
          priceRange,
          ratingFilter: sq.min_rating,
          openNow: sq.open_now,
          userLocationSearch: sq.use_user_location,
          subcategory: sq.subcategory,
          hasWebsite: sq.has_website,
          hasPhone: sq.has_phone,
        },
      };
    }

    // Fallback to basic message parsing if no cached context
    console.info(
      `No cached context found for session: ${sessionId}, falling back to message parsing`
    );
    return this.fallbackExtractSearchContext();
  }

  // Fallback method for when no cached context is available
  private fallbackExtractSearchContext(): {
    lastQuery?: string;
    lastLocation?: string;
    lastCategory?: string;
    lastDistance?: string;
  } {
    console.warn('Using fallback context extraction - limited reliability');
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
      const searchContext = this.extractSearchContext(sessionId);

      // Build conversation history for Groq
      const conversationHistory = context.messages
        .slice(-4) // Last 4 messages for context
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Create enhanced prompt with AI-powered context
      const prompt = `
CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER QUERY: "${userQuery}"

PREVIOUS SEARCH CONTEXT (AI-GENERATED):
${searchContext.lastQuery ? `Last Query: "${searchContext.lastQuery}"` : 'No previous search'}
${searchContext.lastLocation ? `Last Location: "${searchContext.lastLocation}"` : 'No location context'}
${searchContext.lastCategory ? `Last Category: "${searchContext.lastCategory}"` : 'No category context'}
${searchContext.lastDistance ? `Last Distance: "${searchContext.lastDistance}"` : 'No distance context'}

DETAILED PREVIOUS CONTEXT:
${
  searchContext.detailedContext
    ? `
- Search Type: ${searchContext.detailedContext.searchType || 'General'}
- Features: ${searchContext.detailedContext.features?.join(', ') || 'None specified'}
- Price Range: ${searchContext.detailedContext.priceRange || 'Any price level'}
- Rating Filter: ${searchContext.detailedContext.ratingFilter ? `${searchContext.detailedContext.ratingFilter}+ stars` : 'Any rating'}
- Open Now: ${searchContext.detailedContext.openNow ? 'Yes' : 'Not specified'}
- User Location Search: ${searchContext.detailedContext.userLocationSearch ? 'Yes' : 'No'}
- Subcategory: ${searchContext.detailedContext.subcategory || 'Not specified'}
- Website Required: ${searchContext.detailedContext.hasWebsite ? 'Yes' : 'Not specified'}
- Phone Required: ${searchContext.detailedContext.hasPhone ? 'Yes' : 'Not specified'}
`
    : 'No detailed context available'
}

IMPORTANT: Use the detailed context above to generate refined server_query that preserves relevant aspects from the previous search while incorporating the new user requirements.

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
          'location_permission',
          'missing_reference_location',
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

      console.log('response', response);

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
      'within',
      'radius',
      'closer than',
      'further than',
      'make it',
      'change to',
      'expand to',
      'narrow to',
    ];

    const lowerQuery = query.toLowerCase();

    // Check for distance modification patterns
    const distanceModificationPatterns = [
      /make it \d+/,
      /change (?:to|the distance to) \d+/,
      /expand (?:to|the radius to) \d+/,
      /narrow (?:to|the radius to) \d+/,
      /instead of \d+/,
      /\d+(?:\.\d+)?\s*(?:m|km|meters?|kilometers?) instead/,
    ];

    return (
      followupWords.some((word) => lowerQuery.includes(word)) ||
      distanceModificationPatterns.some((pattern) => pattern.test(lowerQuery))
    );
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
