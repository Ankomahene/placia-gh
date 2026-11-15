import { z } from 'zod';
import type { LLMRouter } from '../ai';

/*
 * AI help for contributions. Two jobs, both advisory:
 *  - extract: turn "new pharmacy opposite the Shell at Madina" into form fields the user checks;
 *  - precheck: flag spam, implausible entries and likely duplicates for the human reviewer.
 * A person always makes the final call; when the AI is down, both return null and the flow goes on.
 */

export interface CategoryOption {
  id: number;
  slug: string;
  name: string;
  /** Everyday words for it ("chemical shop"), so the model maps local terms right. */
  synonyms?: string[];
}

export const ExtractSchema = z.object({
  name: z.string().describe('The place name, properly capitalised; empty if not given'),
  category_slug: z.string().describe('One slug from the list, or empty if unclear'),
  landmark: z.string().describe('Where it is in words: landmark, street or area; empty if none'),
  phone: z.string().describe('Phone number if given, else empty'),
  hours: z.string().describe('Opening hours if given, in plain words, else empty'),
});
export type Extracted = z.infer<typeof ExtractSchema>;

export async function extractPlace(
  llm: LLMRouter,
  text: string,
  categories: CategoryOption[],
  timeoutMs = 12_000,
): Promise<Extracted | null> {
  try {
    const res = await llm.generateObject({
      system: [
        'You turn a short description of a place in Ghana into form fields.',
        'Use only what the text says. Never invent a name, phone number or hours.',
        `Category slugs: ${categories
          .map((c) => `${c.slug} (${[c.name, ...(c.synonyms ?? []).slice(0, 4)].join(', ')})`)
          .join('; ')}`,
      ].join('\n'),
      prompt: text.slice(0, 500),
      schema: ExtractSchema,
      schemaName: 'place_fields',
      effort: 'low',
      maxTokens: 400,
      timeoutMs,
    });
    const known = new Set(categories.map((c) => c.slug));
    return {
      ...res.data,
      category_slug: known.has(res.data.category_slug) ? res.data.category_slug : '',
    };
  } catch {
    return null;
  }
}

export const PrecheckSchema = z.object({
  verdict: z.enum(['looks_good', 'needs_check', 'reject']),
  spam: z.number().describe('0 = clearly genuine, 1 = clearly spam, abuse or a test'),
  duplicate_of: z
    .string()
    .describe('The id of an existing nearby place this repeats, or empty if none'),
  reasons: z.array(z.string()).describe('Up to three short reasons for a human reviewer'),
});

export interface PrecheckInput {
  kind: 'new_place' | 'edit' | 'report' | 'photo';
  /** What the user submitted, as shown to the reviewer. */
  submitted: Record<string, unknown>;
  /** The place as it is now, for edits and reports. */
  current?: Record<string, unknown> | null;
  /** Existing places close by with similar names: duplicate candidates. */
  nearby?: { id: string; name: string; category: string | null; distance_m: number | null }[];
}

export interface Precheck {
  verdict: 'looks_good' | 'needs_check' | 'reject';
  spam: number;
  duplicate_of: string | null;
  reasons: string[];
  provider: string;
  model: string;
  latency_ms: number;
}

export async function precheck(
  llm: LLMRouter,
  input: PrecheckInput,
  timeoutMs = 8000,
): Promise<Precheck | null> {
  try {
    const res = await llm.generateObject({
      system: [
        'You pre-check community contributions to a map of places in Ghana for a human moderator.',
        'Flag: spam, ads, abuse, jokes, test entries, names that are not places, edits that look like vandalism,',
        'and new places that repeat an existing nearby place (same business, maybe spelt differently).',
        'Ghanaian names, Twi words and pidgin are normal, not suspicious. Be brief and concrete.',
        'verdict: looks_good if a moderator can approve without checking, needs_check if unsure, reject if clearly bad.',
      ].join('\n'),
      prompt: JSON.stringify(input),
      schema: PrecheckSchema,
      schemaName: 'precheck',
      effort: 'low',
      maxTokens: 400,
      timeoutMs,
    });
    const ids = new Set((input.nearby ?? []).map((n) => n.id));
    const d = res.data;
    return {
      verdict: d.verdict,
      spam: Math.min(1, Math.max(0, d.spam)),
      // Only an id we actually showed it counts; anything else is made up.
      duplicate_of: d.duplicate_of && ids.has(d.duplicate_of) ? d.duplicate_of : null,
      reasons: d.reasons.slice(0, 3),
      provider: res.provider,
      model: res.model,
      latency_ms: res.latencyMs,
    };
  } catch {
    return null;
  }
}
