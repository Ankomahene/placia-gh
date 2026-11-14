import type { LLMRouter } from '../ai/router';
import type { Embedder } from '../ai/types';
import { type ParseOptions, parseQuery } from './ai-parse';
import { AREA_RADIUS_M, type LocalityKind, type SearchContext } from './context';
import type { Intent, ParseResult } from './intent';
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
export function fusionWeights(intent: Intent, hasCentre: boolean): Partial<FusionWeights> {
  const w: Partial<FusionWeights> = {};
  if (intent.categories.length && hasCentre && intent.area?.relation !== 'soft') w.proximity = 1.5;
  if (intent.area?.relation === 'soft') w.name = 0.5;
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
    weights: FusionWeights;
    semantic: boolean;
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
}

const NEAR_ME_RADIUS = 5_000;
const ANCHOR_RADIUS = 2_000;
const MIN_RESULTS = 3;
const MAX_RADIUS = 100_000;

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

  const parsed = await parseQuery(req.q, deps.context, {
    llm: deps.llm,
    budgetMs: deps.aiBudgetMs,
    user,
    mode: req.mode,
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

  let embedding: string | null = null;
  let embedMs = 0;
  const embedText = text || intent.categories.join(' ');
  if (deps.embedder && embedText) {
    const te = performance.now();
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 1200);
      const { vectors } = await deps.embedder.embed([embedText], ac.signal);
      clearTimeout(timer);
      if (vectors[0]) embedding = `[${vectors[0].join(',')}]`;
    } catch {
      // Semantic arm is optional; lexical arms still answer.
    }
    embedMs = ms(te);
  }

  const categoryIds = intent.categories
    .map((s) => deps.context.bySlug.get(s)?.id)
    .filter((x): x is number => x != null);

  const weights = { ...fusionWeights({ ...intent, text }, centre != null), ...req.weights };

  const args = (r: number | null) => ({
    p_text: text || null,
    p_categories: categoryIds.length ? categoryIds : null,
    p_lat: centre?.lat ?? null,
    p_lon: centre?.lon ?? null,
    p_radius_m: r,
    p_district_id: districtId,
    p_region_id: regionId,
    p_embedding: embedding,
    p_limit: limit,
    p_offset: offset,
    p_weights: Object.keys(weights).length ? weights : null,
  });

  const td = performance.now();
  let rows: Row[] = [];
  let widenedTo: number | null = null;
  if (text || categoryIds.length || embedding || centre || districtId || regionId) {
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
      weights: { ...DEFAULT_WEIGHTS, ...weights },
      semantic: embedding != null,
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
