import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConversationAnalysis {
  is_followup: boolean;
  followup_type: 'refinement' | 'category_change' | 'new_search';
  refined_query: string;
  confidence: number;
}

const CONVERSATION_FLOW_SYSTEM_PROMPT = `You are an AI that understands natural conversation flow in location-based search queries.

Your job is to:
1. Determine if a new user query is a follow-up or a new search.
2. If it's a follow-up, rewrite it into a refined full query that preserves and modifies the original context.

—

FOLLOW-UP RULES:
A query is a follow-up if:
- It uses reference words (e.g., "those", "them", "ones", etc.).
- It adds features, preferences, or filters (e.g., "open late", "budget friendly", "rooftop", etc).
- It includes sort-like phrasing (e.g., "show them from cheapest").
- It uses transition cues (e.g., "what about", "instead", "also", "now show me").

It is a new search if:
- It mentions a new place type and a new location.
- It doesn't refer to or build upon the previous query.
- It starts a totally unrelated topic.

—

REFINEMENT LOGIC:
If the query is a follow-up:
- Always include the original place type (e.g., "restaurants") unless the user switches category.
- Always include the original location (e.g., "Osu", "Accra", etc.) unless the location changes.
- Add any new descriptors (e.g., "rooftop", "budget friendly") before the place type.
- Do not include vague references like "ones", "those", "them".
- Never include sort instructions like "order by" or "show from cheapest" — another system handles that.

Use this structure for refinement:
[NEW DESCRIPTORS] + [PLACE TYPE] + [PREVIOUS FILTERS, if not contradicted] + [LOCATION]

For category switches (e.g., "What about hotels instead?"):
→ Replace the place type, but retain filters and location.

—

RESPONSE FORMAT:
Always return JSON like: 
{
  "is_followup": true | false,
  "followup_type": "refinement" | "category_change" | "new_search",
  "refined_query": "Your final rewritten natural query",
  "confidence": float (0.0 - 1.0)
}

—

DO:
- Keep refined queries natural and full.
- Reuse relevant context from the previous message.
- Favor follow-up if unsure but keep confidence low (< 0.7).

DO NOT:
- Use vague words like "those", "ones", or "them" in the refined query.
- Repeat sort instructions.
- Omit the place type or location unless the user explicitly changes them.

**IMPORTANT**
If the user uses vague terms like "places|place", "spots", or "locations" in a follow-up, assume they are referring to the original place type (e.g., "restaurants") unless they clearly specify a different category.
Keep refined queries natural and conversational
if the user specified a location, in the previous query, always keep it in the refined query
`;

export async function analyzeConversationFlow(
  currentQuery: string,
  previousQuery?: string
): Promise<ConversationAnalysis> {
  try {
    // If no previous query, it's definitely a new search
    if (!previousQuery) {
      return {
        is_followup: false,
        followup_type: 'new_search',
        refined_query: currentQuery,
        confidence: 1.0,
      };
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: CONVERSATION_FLOW_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Previous query: "${previousQuery}"\nCurrent query: "${currentQuery}"\n\nAnalyze if the current query is a follow-up and provide a refined query.`,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content) as ConversationAnalysis;

    // Validate the response
    if (typeof analysis.is_followup !== 'boolean') {
      analysis.is_followup = false;
    }

    if (
      !['refinement', 'category_change', 'new_search'].includes(
        analysis.followup_type
      )
    ) {
      analysis.followup_type = 'new_search';
    }

    if (!analysis.refined_query) {
      analysis.refined_query = currentQuery;
    }

    if (
      typeof analysis.confidence !== 'number' ||
      analysis.confidence < 0 ||
      analysis.confidence > 1
    ) {
      analysis.confidence = 0.5;
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing conversation flow:', error);

    // Fallback: simple heuristic detection
    const isLikelyFollowup = hasFollowupIndicators(currentQuery);

    return {
      is_followup: isLikelyFollowup,
      followup_type: isLikelyFollowup ? 'refinement' : 'new_search',
      refined_query:
        isLikelyFollowup && previousQuery
          ? `${currentQuery} ${extractLocationFromQuery(previousQuery)}`
          : currentQuery,
      confidence: 0.6,
    };
  }
}

// Simple heuristic fallback for follow-up detection
function hasFollowupIndicators(query: string): boolean {
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
  ];

  const lowerQuery = query.toLowerCase();
  return followupWords.some((word) => lowerQuery.includes(word));
}

// Extract location context from a query (simple regex approach)
function extractLocationFromQuery(query: string): string {
  const locationPatterns = [
    /near\s+([^,]+)/i,
    /in\s+([^,]+)/i,
    /around\s+([^,]+)/i,
    /at\s+([^,]+)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return `near ${match[1].trim()}`;
    }
  }

  return '';
}

export interface ConversationContext {
  queries: string[];
  currentQuery?: string;
}

export function createConversationContext(): ConversationContext {
  return {
    queries: [],
  };
}

export function addToConversationContext(
  context: ConversationContext,
  query: string
): ConversationContext {
  return {
    queries: [...context.queries, query],
    currentQuery: query,
  };
}

export function getLastQuery(context: ConversationContext): string | undefined {
  return context.queries[context.queries.length - 1];
}

export function getPreviousQuery(
  context: ConversationContext
): string | undefined {
  return context.queries[context.queries.length - 2];
}
