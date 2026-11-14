import { z } from 'zod';
import type { LLMRouter } from '../ai/router';
import { expandCategory, type SearchContext } from './context';
import type { Intent, ParseResult } from './intent';
import { findCategories, fuzzyArea, parseRules, pickArea, rulesUnsure } from './rules';
import { normalize, words } from './text';

/**
 * LLM query understanding. The model only extracts structure; every value it returns is checked
 * against our own vocabulary (category slugs, gazetteer), so a hallucinated category or town can
 * never reach the database. Any failure returns the rule-based intent instead.
 */

export const AIIntentSchema = z.object({
  what: z
    .string()
    .describe(
      'Keywords for the thing wanted: a place name, food, product or service. No location words.',
    ),
  categories: z
    .array(z.string())
    .max(4)
    .describe('Category slugs from the list that fit what is wanted. Empty if none fit.'),
  location: z
    .string()
    .nullable()
    .describe(
      'Town, area, landmark or place the search is in or around, as written. Null if none.',
    ),
  location_relation: z
    .enum(['in', 'near'])
    .nullable()
    .describe('"in" when the results must be inside the location, "near" when around it is fine.'),
  near_me: z.boolean().describe('The user wants places near their current position.'),
  open_now: z.boolean().describe('The user wants places that are open now.'),
  cheap: z.boolean().describe('The user wants cheap or affordable places.'),
});
export type AIIntent = z.infer<typeof AIIntentSchema>;

export function systemPrompt(ctx: SearchContext) {
  const groups = ctx.categories.filter((c) => c.parentId == null);
  const lines = groups.map((g) => {
    const leaves = ctx.categories.filter((c) => c.parentId === g.id).map((c) => c.slug);
    return `- ${g.slug}: ${leaves.join(', ')}`;
  });
  return [
    'You turn place-search queries from Ghana into structured filters.',
    'Users write Ghanaian English and local terms: "chop bar" is a local restaurant, "chemical shop" a pharmacy, "trotro station" a minibus station, "drinking spot" a bar, "provisions" a small grocery, "momo" mobile money.',
    'Category slugs (group: leaves). Use leaf slugs; a group slug means all of its leaves:',
    ...lines,
    'Keep place names exactly as written, including misspellings; do not translate them.',
    'If the query names one specific place ("Korle Bu Teaching Hospital", "Accra Mall"), put that name in "what" and leave location null unless another location is given.',
  ].join('\n');
}

/** Turn the model's output into an Intent using only values we can verify. */
export function resolveAIIntent(
  ai: AIIntent,
  query: string,
  ctx: SearchContext,
  user?: { lat: number; lon: number } | null,
): Intent {
  const categories = [...new Set(ai.categories.flatMap((s) => expandCategory(ctx, s.trim())))];
  let text = normalize(ai.what);
  // The model sometimes leaves "what" empty when only a category was asked for.
  if (!text && !categories.length && !ai.location && !ai.near_me) text = normalize(query);

  let area: Intent['area'] = null;
  let anchor: string | null = null;
  const loc = ai.location ? normalize(ai.location).replace(/^the /, '') : '';
  if (loc) {
    const key = ctx.areas.has(loc) ? loc : fuzzyArea(ctx, loc);
    const picked = key ? pickArea(ctx.areas.get(key), user) : null;
    if (picked) {
      area = {
        kind: picked.kind,
        id: picked.id,
        name: picked.name,
        lat: picked.lat,
        lon: picked.lon,
        relation: ai.location_relation ?? 'in',
      };
    } else {
      // Not a gazetteer name: maybe a landmark place ("Accra Mall"), or an area plus a spot.
      anchor = loc;
      const toks = words(loc);
      for (let len = toks.length - 1; len >= 1 && !area; len--) {
        const k = toks.slice(0, len).join(' ');
        const a = pickArea(ctx.areas.get(k), user);
        if (a) {
          area = {
            kind: a.kind,
            id: a.id,
            name: a.name,
            lat: a.lat,
            lon: a.lon,
            relation: ai.location_relation ?? 'near',
          };
        }
      }
    }
  }

  // Categories the model missed but our synonym list knows about are added, never removed.
  for (const s of findCategories(ctx, words(text))) if (!categories.includes(s)) categories.push(s);

  return {
    text,
    categories,
    area,
    anchor,
    nearMe: ai.near_me,
    openNow: ai.open_now,
    cheap: ai.cheap,
  };
}

const cache = new Map<string, { intent: AIIntent; model: string; provider: string }>();
const CACHE_MAX = 1000;

export interface ParseOptions {
  llm?: LLMRouter | null;
  /** Total time the AI parse may take before the rules result is used. */
  budgetMs?: number;
  user?: { lat: number; lon: number } | null;
  /** Force a path, for evals and debugging. */
  mode?: 'auto' | 'rules' | 'ai';
  /**
   * 'selective' (default): call the AI only when the rule parse is unsure (rulesUnsure()).
   * 'always': every query goes to the AI first.
   */
  aiPolicy?: 'selective' | 'always';
}

/** Parse a query: AI when configured and fast enough, rules otherwise. Never throws. */
export async function parseQuery(
  query: string,
  ctx: SearchContext,
  opts: ParseOptions = {},
): Promise<ParseResult> {
  const t0 = performance.now();
  const rules = () => parseRules(query, ctx, { user: opts.user });
  const elapsed = () => Math.round(performance.now() - t0);
  if (opts.mode === 'rules' || !opts.llm) {
    return {
      intent: rules(),
      path: 'rules',
      latencyMs: elapsed(),
      fallback: opts.mode === 'rules' ? undefined : 'not_configured',
    };
  }
  // The rules are sure of most queries: answer at once, no AI latency or cost.
  let aiReason: string | undefined;
  if (opts.mode !== 'ai' && (opts.aiPolicy ?? 'selective') === 'selective') {
    const intent = rules();
    const reason = rulesUnsure(query, intent, ctx);
    if (!reason) {
      return { intent, path: 'rules', latencyMs: elapsed(), fallback: 'rules_confident' };
    }
    aiReason = reason;
  }
  // Every provider recently failed: answer from rules now, the breaker retries later.
  if (opts.mode !== 'ai' && !opts.llm.available()) {
    return {
      intent: rules(),
      path: 'rules',
      latencyMs: elapsed(),
      fallback: 'circuit_open',
      aiReason,
    };
  }

  const key = normalize(query);
  const hit = cache.get(key);
  if (hit) {
    return {
      intent: resolveAIIntent(hit.intent, query, ctx, opts.user),
      path: 'ai',
      latencyMs: elapsed(),
      provider: hit.provider,
      model: hit.model,
      cached: true,
      aiReason,
    };
  }

  const budget = opts.budgetMs ?? 2500;
  const call = opts.llm
    .generateObject({
      system: systemPrompt(ctx),
      prompt: query,
      schema: AIIntentSchema,
      schemaName: 'search_intent',
      effort: 'low',
      maxTokens: 400,
      timeoutMs: budget,
    })
    .then((res) => {
      // A late answer still lands in the cache, so the next identical query gets the AI parse.
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
      cache.set(key, { intent: res.data, model: res.model, provider: res.provider });
      return res;
    });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('budget_exceeded')), budget);
  });
  call.catch(() => {});

  try {
    const res = await Promise.race([call, deadline]);
    return {
      intent: resolveAIIntent(res.data, query, ctx, opts.user),
      path: 'ai',
      latencyMs: elapsed(),
      provider: res.provider,
      model: res.model,
      inputTokens: res.usage.inputTokens,
      outputTokens: res.usage.outputTokens,
      aiReason,
    };
  } catch (err) {
    return {
      intent: rules(),
      path: 'rules',
      latencyMs: elapsed(),
      fallback: err instanceof Error ? err.message.slice(0, 200) : 'ai_failed',
      aiReason,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** For tests. */
export function clearParseCache() {
  cache.clear();
}
