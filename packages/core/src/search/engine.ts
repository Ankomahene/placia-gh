import type { LLMRouter } from '../ai/router';
import type { Embedder } from '../ai/types';
import { type ParseOptions, parseQuery } from './ai-parse';
import {
  AREA_RADIUS_M,
  type AreaChoice,
  type LocalityKind,
  type SearchContext,
  sameNameAreas,
} from './context';
import type { Intent, ParseResult } from './intent';
import { onlyCategoryWords, parseRules } from './rules';
import { normalize, words } from './text';

/** The one database call search needs. Kept structural so core stays framework-free. */
export type SearchRpc = (
  fn: 'search_places',
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

export interface SearchRequest {
  q: string;
  lat?: number | null;
  lon?: number | null;
  limit?: number;
  offset?: number;
  mode?: ParseOptions['mode'];
  /** Override fusion weights (evals and ablations). 0 switches an arm off. */
  weights?: Partial<FusionWeights>;
}

export interface FusionWeights {
  title: number;
  fts: number;
  name: number;
  category: number;
  semantic: number;
  near: number;
  proximity: number;
  confidence: number;
}

/** The database defaults (see the search_weights migration). */
export const DEFAULT_WEIGHTS: FusionWeights = {
  title: 1,
  fts: 1,
  name: 1,
  category: 0.8,
  semantic: 1,
  near: 1,
  proximity: 0.5,
  confidence: 0.4,
};

/**
 * Fusion weights for this intent. "A kind of place around here" leans on distance; a query
 * that carries a town name as text turns the trigram arm down, because every "Kumasi …" name is
 * a fuzzy match for "kath kumasi".
 */
/**
 * Pure "kind of place" queries ("pharmacy in madina", "chop bar") are answered by the category arm
 * and distance. Name and meaning arms add places merely *called* "… Pharmacy" or *similar to*
 * one, so they step back. Chosen by a sweep on the dev set, judged on held-out v2
 * (docs/EVALS.md, "Pure browse weights"). With semantic 0 the query is never embedded.
 */
export const BROWSE_WEIGHTS: Partial<FusionWeights> = { semantic: 0, title: 0.5, name: 0.5 };

export function fusionWeights(
  intent: Intent,
  hasCentre: boolean,
  pureBrowse = false,
  browse: Partial<FusionWeights> = BROWSE_WEIGHTS,
): Partial<FusionWeights> {
  const w: Partial<FusionWeights> = {};
  if (intent.categories.length && hasCentre && intent.area?.relation !== 'soft') w.proximity = 1.5;
  if (intent.area?.relation === 'soft') w.name = 0.5;
  if (pureBrowse) Object.assign(w, browse);
  return w;
}

export interface SearchResult {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  locality: string | null;
  district: string | null;
  address: string | null;
  lat: number;
  lon: number;
  distanceM: number | null;
  confidence: number;
  openingHours: unknown;
  score: number;
  /** Rank of this place in each retrieval arm that found it: why it is in the results. */
  arms: Record<string, number>;
}

export interface SearchResponse {
  query: string;
  intent: Intent;
  results: SearchResult[];
  meta: {
    parse: Omit<ParseResult, 'intent'>;
    centre: { lat: number; lon: number; from: 'area' | 'anchor' | 'user' } | null;
    radiusM: number | null;
    /** The first radius returned too little, so it was widened to this. */
    widenedTo: number | null;
    /** "near me" without a location: the client should ask for one. */
    needsLocation: boolean;
    anchor: { text: string; place: string | null } | null;
    /**
     * Where the searched town is, and other towns with the same name ("Anloga": Volta or
     * Kumasi). The client can offer them; each choice's `query` re-runs the search there.
     */
    area: { where: string; others: AreaChoice[] } | null;
    weights: FusionWeights;
    semantic: boolean;
    /** Only category words in the text: name and meaning arms step back. */
    pureBrowse: boolean;
    timings: { parseMs: number; anchorMs: number; embedMs: number; dbMs: number; totalMs: number };
  };
}

export interface SearchDeps {
  rpc: SearchRpc;
  context: SearchContext;
  llm?: LLMRouter | null;
  embedder?: Embedder | null;
  /** AI parse budget; past it the rules parse is used. */
  aiBudgetMs?: number;
  /** When to ask the AI parse; see ParseOptions. */
  aiPolicy?: 'selective' | 'always';
  /** Override BROWSE_WEIGHTS (evals). */
  browseWeights?: Partial<FusionWeights>;
}

const NEAR_ME_RADIUS = 5_000;
const ANCHOR_RADIUS = 2_000;
const MIN_RESULTS = 3;
const MAX_RADIUS = 100_000;
/** The semantic arm is optional: past this the lexical arms answer alone. */
const EMBED_BUDGET_MS = 1200;

const vectorCache = new Map<string, string>();
const VECTOR_CACHE_MAX = 2000;

/** pgvector literal for the query, or null when there's nothing to embed or the call fails. */
async function embedQuery(embedder: Embedder, text: string) {
  const t0 = performance.now();
  const key = normalize(text);
  if (!key) return { vector: null, ms: 0 };
  const hit = vectorCache.get(key);
  if (hit) return { vector: hit, ms: 0 };
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), EMBED_BUDGET_MS);
  try {
    const { vectors } = await embedder.embed([key], ac.signal);
    if (!vectors[0]) return { vector: null, ms: Math.round(performance.now() - t0) };
    const vector = `[${vectors[0].map((x) => x.toFixed(5)).join(',')}]`;
    if (vectorCache.size >= VECTOR_CACHE_MAX)
      vectorCache.delete(vectorCache.keys().next().value as string);
    vectorCache.set(key, vector);
    return { vector, ms: Math.round(performance.now() - t0) };
  } catch {
    return { vector: null, ms: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }
}

interface Row {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  locality: string | null;
  district: string | null;
  address: string | null;
  lat: number;
  lon: number;
  distance_m: number | null;
  confidence: number;
  opening_hours: unknown;
  score: number;
  arms: Record<string, number>;
}

function toResult(r: Row): SearchResult {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    locality: r.locality,
    district: r.district,
    address: r.address,
    lat: r.lat,
    lon: r.lon,
    distanceM: r.distance_m,
    confidence: r.confidence,
    openingHours: r.opening_hours,
    score: r.score,
    arms: r.arms,
  };
}

async function callSearch(rpc: SearchRpc, args: Record<string, unknown>) {
  const { data, error } = await rpc('search_places', args);
  if (error) throw new Error(`search_places: ${error.message}`);
  return (data as Row[]) ?? [];
}

/** Does this place name plausibly be the landmark the user meant? Every anchor word must appear. */
function namesAnchor(name: string, anchor: string) {
  const have = new Set(words(normalize(name)));
  return words(anchor).every((w) => have.has(w) || [...have].some((h) => h.startsWith(w)));
}

export async function search(req: SearchRequest, deps: SearchDeps): Promise<SearchResponse> {
  const t0 = performance.now();
  const ms = (since: number) => Math.round(performance.now() - since);
  const user = req.lat != null && req.lon != null ? { lat: req.lat, lon: req.lon } : null;
  const limit = Math.min(Math.max(req.limit ?? 20, 1), 50);
  const offset = Math.max(req.offset ?? 0, 0);

  // The query embedding doesn't wait for the AI parse: it embeds what the rule parse says is being
  // looked for (area words stripped), so the two network calls overlap.
  // A pure category query gets no meaning arm, so it skips the embedding call (time and money).
  const quick = parseRules(req.q, deps.context, { user });
  const browse = deps.browseWeights ?? BROWSE_WEIGHTS;
  const skipEmbed =
    browse.semantic === 0 &&
    quick.categories.length > 0 &&
    onlyCategoryWords(deps.context, quick.text);
  const embedding =
    deps.embedder && !skipEmbed
      ? embedQuery(deps.embedder, quick.text || quick.categories.join(' '))
      : Promise.resolve({ vector: null, ms: 0 });

  const parsed = await parseQuery(req.q, deps.context, {
    llm: deps.llm,
    budgetMs: deps.aiBudgetMs,
    user,
    mode: req.mode,
    aiPolicy: deps.aiPolicy,
  });
  const { intent, ...parseMeta } = parsed;
  const parseMs = parsed.latencyMs;

  let text = intent.text;
  let centre: SearchResponse['meta']['centre'] = null;
  let radius: number | null = null;
  let districtId: number | null = null;
  let regionId: number | null = null;
  let needsLocation = false;
  let anchorMeta: SearchResponse['meta']['anchor'] = null;
  let anchorMs = 0;

  // A landmark the gazetteer can't place ("near accra mall"): find the place, search around it.
  if (intent.anchor) {
    const ta = performance.now();
    const rows = await callSearch(deps.rpc, {
      p_text: intent.anchor,
      p_lat: intent.area?.lat ?? user?.lat ?? null,
      p_lon: intent.area?.lon ?? user?.lon ?? null,
      p_limit: 3,
    });
    anchorMs = ms(ta);
    const hit = rows.find((r) => namesAnchor(r.name, intent.anchor as string));
    anchorMeta = { text: intent.anchor, place: hit?.name ?? null };
    if (hit) {
      centre = { lat: hit.lat, lon: hit.lon, from: 'anchor' };
      radius = ANCHOR_RADIUS;
    } else if (!intent.area) {
      // Couldn't place it anywhere: let the words count as search terms instead.
      text = [text, intent.anchor].filter(Boolean).join(' ');
    }
  }

  const area = intent.area;
  if (!centre && area) {
    if (area.relation !== 'soft' && area.kind === 'region') regionId = area.id;
    else if (area.relation !== 'soft' && area.kind === 'district') districtId = area.id;
    else {
      centre = { lat: area.lat, lon: area.lon, from: 'area' };
      if (area.relation !== 'soft' && area.kind !== 'region' && area.kind !== 'district') {
        const base = AREA_RADIUS_M[area.kind as LocalityKind];
        radius = area.relation === 'near' ? Math.round(base * 1.5) : base;
      }
    }
  }
  if (!centre && !districtId && !regionId && intent.nearMe) {
    if (user) {
      centre = { ...user, from: 'user' };
      radius = NEAR_ME_RADIUS;
    } else needsLocation = true;
  }
  // No place named at all: still prefer what's close to the user, without excluding anything.
  if (!centre && !districtId && !regionId && user) centre = { ...user, from: 'user' };

  const { vector, ms: embedMs } = await embedding;

  const categoryIds = intent.categories
    .map((s) => deps.context.bySlug.get(s)?.id)
    .filter((x): x is number => x != null);

  const pureBrowse = intent.categories.length > 0 && onlyCategoryWords(deps.context, text);
  const weights = {
    ...fusionWeights({ ...intent, text }, centre != null, pureBrowse, deps.browseWeights),
    ...req.weights,
  };

  const args = (r: number | null) => ({
    p_text: text || null,
    p_categories: categoryIds.length ? categoryIds : null,
    p_lat: centre?.lat ?? null,
    p_lon: centre?.lon ?? null,
    p_radius_m: r,
    p_district_id: districtId,
    p_region_id: regionId,
    p_embedding: vector,
    p_limit: limit,
    p_offset: offset,
    p_weights: Object.keys(weights).length ? weights : null,
  });

  const td = performance.now();
  let rows: Row[] = [];
  let widenedTo: number | null = null;
  if (text || categoryIds.length || vector || centre || districtId || regionId) {
    rows = await callSearch(deps.rpc, args(radius));
    // Too little nearby: widen the circle rather than show an empty screen.
    let r = radius;
    while (r && offset === 0 && rows.length < MIN_RESULTS && r < MAX_RADIUS) {
      r = Math.min(r * 3, MAX_RADIUS);
      rows = await callSearch(deps.rpc, args(r));
      widenedTo = r;
    }
  }
  const dbMs = ms(td);

  return {
    query: req.q,
    intent: { ...intent, text },
    results: rows.map(toResult),
    meta: {
      parse: parseMeta,
      centre,
      radiusM: radius,
      widenedTo,
      needsLocation,
      anchor: anchorMeta,
      area: intent.area ? sameNameAreas(deps.context, intent.area) : null,
      weights: { ...DEFAULT_WEIGHTS, ...weights },
      semantic: vector != null,
      pureBrowse,
      timings: { parseMs, anchorMs, embedMs, dbMs, totalMs: ms(t0) },
    },
  };
}

/** Row for `search_events`: no precise location (rounded to ~1 km), no user id. */
export function toSearchEvent(res: SearchResponse, req: SearchRequest, sessionId?: string | null) {
  const coarse =
    req.lat != null && req.lon != null
      ? `SRID=4326;POINT(${req.lon.toFixed(2)} ${req.lat.toFixed(2)})`
      : null;
  return {
    session_id: sessionId ?? null,
    query: req.q.slice(0, 300),
    parsed: res.intent as unknown as Record<string, unknown>,
    parse_path: res.meta.parse.path,
    provider: res.meta.parse.provider ?? null,
    model: res.meta.parse.model ?? null,
    input_tokens: res.meta.parse.inputTokens ?? null,
    output_tokens: res.meta.parse.outputTokens ?? null,
    ai_latency_ms: res.meta.parse.path === 'ai' ? res.meta.parse.latencyMs : null,
    total_latency_ms: res.meta.timings.totalMs,
    result_count: res.results.length,
    top_place_ids: res.results.slice(0, 10).map((r) => r.id),
    coarse_location: coarse,
    error:
      res.meta.parse.fallback && res.meta.parse.fallback !== 'not_configured'
        ? res.meta.parse.fallback
        : null,
  };
}
