import {
  aiConfigFromEnv,
  createEmbedder,
  createLLM,
  type Embedder,
  type LLMRouter,
} from '@placia/core/ai';
import { loadSearchContext, search, toSearchEvent } from '@placia/core/search';
import { createServiceClient } from '@placia/db';
import { after, type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/search?q=pharmacy+near+madina[&lat=5.6&lon=-0.17][&limit=20][&offset=0]
 *
 * Parses the query (AI when configured and fast, rules otherwise), runs hybrid search in
 * Postgres and returns results plus `meta` saying which path ran and how long each step took.
 * Every search is logged to `search_events` after the response is sent, with location rounded
 * to about 1 km and no user id.
 */

const Params = z
  .object({
    q: z.string().trim().min(1).max(200),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    offset: z.coerce.number().int().min(0).max(500).default(0),
  })
  .refine((p) => (p.lat == null) === (p.lon == null), { message: 'lat and lon go together' });

// Shared, stateless clients: safe to reuse across requests (no per-user state lives here).
let db: ReturnType<typeof createServiceClient> | null = null;
let llm: LLMRouter | null | undefined;
let embedder: Embedder | null | undefined;

function deps() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  db ??= createServiceClient(url, key);
  if (llm === undefined) {
    const cfg = aiConfigFromEnv();
    llm = cfg.anthropicApiKey || cfg.openaiApiKey ? createLLM(cfg) : null;
    embedder = cfg.openaiApiKey ? createEmbedder(cfg) : null;
  }
  return { db, llm, embedder: embedder ?? null };
}

export async function GET(req: NextRequest) {
  const parsed = Params.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_query', issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const d = deps();
  if (!d) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const rpc = (fn: string, args?: Record<string, unknown>) => d.db.rpc(fn as never, args as never);
  const p = parsed.data;
  const request = {
    q: p.q,
    lat: p.lat ?? null,
    lon: p.lon ?? null,
    limit: p.limit,
    offset: p.offset,
  };

  try {
    const context = await loadSearchContext(rpc as never);
    const res = await search(request, {
      rpc,
      context,
      llm: d.llm,
      embedder: d.embedder,
      aiBudgetMs: 2500,
    });
    if (p.offset === 0) {
      after(async () => {
        await d.db.from('search_events').insert(toSearchEvent(res, request) as never);
      });
    }
    return NextResponse.json(res, {
      headers: {
        // Location-free searches are the same for everyone for a while; located ones are not.
        'Cache-Control': p.lat == null ? 'public, max-age=60, s-maxage=300' : 'private, no-store',
        'Server-Timing': [
          `parse;dur=${res.meta.timings.parseMs};desc="${res.meta.parse.path}"`,
          `embed;dur=${res.meta.timings.embedMs}`,
          `db;dur=${res.meta.timings.dbMs + res.meta.timings.anchorMs}`,
          `total;dur=${res.meta.timings.totalMs}`,
        ].join(', '),
      },
    });
  } catch (err) {
    console.error('search failed', err);
    return NextResponse.json({ error: 'search_unavailable' }, { status: 503 });
  }
}
