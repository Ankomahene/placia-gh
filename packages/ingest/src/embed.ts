import { createEmbedder } from '@placia/core/ai';
import { createServiceClient } from '@placia/db';
import { log } from './duck';

// text-embedding-3-small list price, USD per million input tokens.
const USD_PER_M_TOKENS = 0.02;
const FETCH = 1000;
const WRITE = 250;
// A stalled request on a flaky link would otherwise hang the run; retry() picks it up.
const REQUEST_TIMEOUT_MS = 60_000;

/**
 * Embeds every active place whose embedding is missing or stale (an edit to its name, category or
 * area clears it, see the places_embedding_stale trigger). Safe to stop and rerun at any point.
 */
export async function embed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const sb = createServiceClient(url, key);
  const embedder = createEmbedder();

  let done = 0;
  let tokens = 0;
  const t0 = Date.now();
  for (;;) {
    const q = await retry(async () => {
      const r = await sb
        .rpc('embedding_queue', { p_limit: FETCH })
        .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS));
      if (r.error) throw new Error(`embedding_queue: ${r.error.message}`);
      return r;
    });
    const rows = q.data ?? [];
    if (rows.length === 0) break;
    if (done === 0) log('embed', `first input: "${rows[0]?.input}"`);

    const { vectors, usage } = await retry(() =>
      embedder.embed(
        rows.map((r) => r.input),
        AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ),
    );
    tokens += usage.inputTokens;

    for (let i = 0; i < rows.length; i += WRITE) {
      const ids = rows.slice(i, i + WRITE).map((r) => r.id);
      // Five decimals keeps more precision than the half-precision column stores.
      const vecs = vectors
        .slice(i, i + WRITE)
        .map((v) => `[${v.map((x) => x.toFixed(5)).join(',')}]`);
      const w = await retry(async () => {
        const r = await sb
          .rpc('set_embeddings', { p_ids: ids, p_vectors: vecs })
          .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS));
        if (r.error) throw new Error(`set_embeddings: ${r.error.message}`);
        return r.data;
      });
      if (w !== ids.length) throw new Error(`set_embeddings wrote ${w} of ${ids.length}`);
    }
    done += rows.length;
    log('embed', `${done} places · ${tokens.toLocaleString()} tokens`);
  }
  const usd = (tokens / 1e6) * USD_PER_M_TOKENS;
  log(
    'embed',
    `${done} embedded with ${embedder.model}@${embedder.dimensions} · ${tokens.toLocaleString()} tokens · ~$${usd.toFixed(3)} · ${Math.round((Date.now() - t0) / 1000)} s`,
  );
}

async function retry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= tries) throw e;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}
