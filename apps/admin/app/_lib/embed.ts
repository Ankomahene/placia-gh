import 'server-only';
import { aiConfigFromEnv, createEmbedder } from '@placia/core/ai';
import { after } from 'next/server';
import type { serviceDb } from './auth';

type Db = NonNullable<ReturnType<typeof serviceDb>>;

/**
 * Recompute places' meaning vectors after the response is sent, so new, renamed or merged
 * places show up for meaning searches right away (a database trigger drops stale ones).
 */
export function reembedLater(db: Db, ids: string[]) {
  const cfg = aiConfigFromEnv();
  if (!cfg.openaiApiKey || !ids.length) return;
  after(async () => {
    const inputs = await Promise.all(
      ids.map(async (id) => {
        const { data } = await db.rpc('place_embedding_input', { p_id: id });
        return typeof data === 'string' && data ? { id, text: data } : null;
      }),
    );
    const ok = inputs.filter((x) => x !== null);
    if (!ok.length) return;
    const { vectors } = await createEmbedder(cfg).embed(ok.map((x) => x.text));
    await db.rpc('set_embeddings', {
      p_ids: ok.map((x) => x.id),
      p_vectors: vectors.map((v) => `[${v.map((x) => x.toFixed(5)).join(',')}]`),
    });
  });
}
