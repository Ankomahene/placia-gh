import { z } from 'zod';
import type { LLMRouter } from '../ai';

/**
 * Search insights: what went wrong in real searches, from the search_events log.
 *
 * Two layers. `flagSearches` is free and runs on every logged search: plain rules over the
 * parsed intent, the results and the searches that came right after. `reviewSearch` asks the
 * model to read one search like a person would ("asked for a pet shop, got cathedrals") and is
 * run on demand, then stored, so each search is paid for at most once.
 */

export interface LoggedResult {
  name: string;
  category: string | null;
  locality: string | null;
}

export interface LoggedSearch {
  id: number;
  created_at: string;
  session_id: string | null;
  query: string;
  parsed: {
    text?: string;
    categories?: string[];
    area?: { name?: string } | null;
    anchor?: string | null;
    nearMe?: boolean;
    /** The place the anchor resolved to; logged since 2026-11-16 (absent before). */
    anchorPlace?: string | null;
  } | null;
  parse_path: string | null;
  error: string | null;
  result_count: number | null;
  total_latency_ms: number | null;
  lat: number | null;
  lon: number | null;
  top: LoggedResult[];
  review: SearchReview | null;
}

export type FlagKind =
  | 'no_results'
  | 'off_category'
  | 'retried'
  | 'ai_failed'
  | 'unplaced'
  | 'stutter'
  | 'vague'
  | 'slow';

export interface Flag {
  kind: FlagKind;
  /** One line a person can act on: "Asked for shop, top results: church ×5". */
  detail: string;
}

export const FLAG_LABELS: Record<FlagKind, string> = {
  no_results: 'No results',
  off_category: 'Wrong kind of place',
  retried: 'Searched again',
  ai_failed: 'AI step failed',
  unplaced: 'Place not found',
  stutter: 'Repeated words',
  vague: 'Too vague',
  slow: 'Slow',
};

/** Flags that mean the person probably didn't get what they wanted. The rest are notes. */
export const PROBLEM_FLAGS = new Set<FlagKind>([
  'no_results',
  'off_category',
  'retried',
  'ai_failed',
  'unplaced',
]);

/** Parse "fallbacks" that are choices, not failures. */
const NOT_FAILURES = new Set(['rules_confident', 'not_configured']);

const SLOW_MS = 5000;
const RETRY_WINDOW_MS = 3 * 60_000;

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Same device, roughly: same session id, or the same ~1 km location cell (or both without one). */
function sameSearcher(a: LoggedSearch, b: LoggedSearch) {
  if (a.session_id || b.session_id) return a.session_id === b.session_id;
  return a.lat === b.lat && a.lon === b.lon;
}

/** "I want I want I want places": a phrase said twice in a row, typical of voice input. */
export function hasStutter(q: string) {
  return /\b(\w+(?:\s+\w+){0,2})(?:\s+\1\b)+/i.test(q);
}

function countBy<T>(xs: T[], key: (x: T) => string) {
  const m = new Map<string, number>();
  for (const x of xs) m.set(key(x), (m.get(key(x)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

const FILLER = new Set(
  'the and for are any some what where can there want looking near around in at to of my me is a an i im it that place places'.split(
    ' ',
  ),
);
const content = (q: string) =>
  new Set(
    norm(q)
      .split(' ')
      .filter((w) => w.length > 1 && !FILLER.has(w)),
  );

/** A rephrase shares words with the first try ("… around dummy" → "… around dome Accra"). */
export function isRephrase(a: string, b: string) {
  const x = content(a);
  const y = content(b);
  if (!x.size || !y.size) return false;
  const shared = [...x].filter((w) => y.has(w)).length;
  return shared / Math.min(x.size, y.size) >= 0.4;
}

/**
 * The next search from the same person within a few minutes, when it rephrases this one:
 * a sign this one didn't give them what they wanted. A new topic is not a retry.
 */
export function nextSearch(events: LoggedSearch[], i: number) {
  const e = events[i];
  if (!e) return null;
  const t = Date.parse(e.created_at);
  for (let j = i + 1; j < events.length; j++) {
    const n = events[j];
    if (!n) break;
    const dt = Date.parse(n.created_at) - t;
    if (dt > RETRY_WINDOW_MS) break;
    if (!sameSearcher(e, n)) continue;
    if (norm(n.query) === norm(e.query)) continue;
    return isRephrase(e.query, n.query) ? { query: n.query, afterMs: dt } : null;
  }
  return null;
}

/**
 * Rule flags for every search. `events` must be oldest first, so "searched again" can look ahead.
 */
export function flagSearches(events: LoggedSearch[]): Flag[][] {
  return events.map((e, i) => {
    const flags: Flag[] = [];
    const p = e.parsed ?? {};
    const cats = p.categories ?? [];

    if (e.result_count === 0) flags.push({ kind: 'no_results', detail: 'Nothing came back' });

    const top = e.top.slice(0, 5);
    const off = top.filter((r) => !r.category || !cats.includes(r.category));
    if (cats.length && top.length >= 3 && off.length > top.length / 2) {
      const got = countBy(off, (r) => r.category ?? 'uncategorised')
        .slice(0, 2)
        .map(([c, n]) => (n > 1 ? `${c} ×${n}` : c))
        .join(', ');
      flags.push({
        kind: 'off_category',
        detail: `Asked for ${cats.join(' or ')}; top results: ${got}`,
      });
    }

    const next = nextSearch(events, i);
    if (next) {
      flags.push({
        kind: 'retried',
        detail: `${Math.max(1, Math.round(next.afterMs / 1000))} s later: "${next.query}"`,
      });
    }

    if (e.error && !NOT_FAILURES.has(e.error)) {
      flags.push({ kind: 'ai_failed', detail: `Fell back to keyword rules (${e.error})` });
    }

    // Only searches logged after anchorPlace was added can say this.
    if (p.anchor && 'anchorPlace' in p && !p.anchorPlace) {
      flags.push({ kind: 'unplaced', detail: `Couldn't find "${p.anchor}" on the map` });
    }

    if (hasStutter(e.query)) flags.push({ kind: 'stutter', detail: 'Likely a voice stutter' });

    if (!p.text && !cats.length && !p.anchor && !p.area && e.result_count !== 0) {
      flags.push({ kind: 'vague', detail: 'No kind of place, name or area' });
    }

    if ((e.total_latency_ms ?? 0) > SLOW_MS) {
      flags.push({
        kind: 'slow',
        detail: `${((e.total_latency_ms ?? 0) / 1000).toFixed(1)} s`,
      });
    }
    return flags;
  });
}

// ---------------------------------------------------------------------------------------------
// AI review
// ---------------------------------------------------------------------------------------------

export const REVIEW_PROBLEMS = [
  'none',
  'wrong_kind',
  'misheard',
  'not_covered',
  'too_vague',
  'missing_place',
  'ranking',
  'other',
] as const;

export const REVIEW_PROBLEM_LABELS: Record<(typeof REVIEW_PROBLEMS)[number], string> = {
  none: 'Fine',
  wrong_kind: 'Wrong kind of place',
  misheard: 'Misheard or typo',
  not_covered: 'Not something Placia covers',
  too_vague: 'Too vague',
  missing_place: 'Place missing from data',
  ranking: 'Right places ranked low',
  other: 'Other',
};

export const ReviewSchema = z.object({
  verdict: z.enum(['good', 'partial', 'bad']),
  problem: z.enum(REVIEW_PROBLEMS),
  summary: z
    .string()
    .describe('One sentence: what the person wanted and what they got, naming results'),
  fix: z.string().describe('One short, concrete fix for the search team, or empty if none'),
});

export interface SearchReview extends z.infer<typeof ReviewSchema> {
  model: string;
  at: string;
}

export async function reviewSearch(
  llm: LLMRouter,
  e: LoggedSearch,
  next: { query: string; afterMs: number } | null,
  timeoutMs = 15_000,
): Promise<SearchReview | null> {
  try {
    const res = await llm.generateObject({
      system: [
        'You review one search on Placia, a places finder for Ghana, for the search team.',
        'Judge whether the results answer what the person meant, as a Ghanaian user would.',
        'Searches are often spoken: watch for words that sound like a place or a common word',
        '("dummy" for Dome, "bus" for bars). If the next search rephrases this one, that shows',
        'what they meant and that this one failed. Placia covers businesses, services and',
        'landmarks, not neighbourhood advice, people or products. Name results when you explain.',
        'verdict: good if the top results fit, partial if some do, bad if none do.',
      ].join('\n'),
      prompt: JSON.stringify({
        query: e.query,
        understood_as: e.parsed,
        used_location: e.lat != null,
        result_count: e.result_count,
        top_results: e.top.slice(0, 5),
        next_search: next
          ? { query: next.query, seconds_later: Math.round(next.afterMs / 1000) }
          : null,
      }),
      schema: ReviewSchema,
      schemaName: 'search_review',
      effort: 'low',
      maxTokens: 300,
      timeoutMs,
    });
    return { ...res.data, model: res.model, at: new Date().toISOString() };
  } catch {
    return null;
  }
}
