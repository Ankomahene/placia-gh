import { after } from 'next/server';
import { z } from 'zod';
import { ai } from '../../_lib/ai';
import { db } from '../../_lib/db';
import { getViewer, isModerator } from '../../_lib/supabase/server';

/** POST /api/review { id, approve, note? }: a moderator's decision, applied in one transaction. */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!isModerator(viewer)) return Response.json({ error: 'forbidden' }, { status: 403 });
  const parsed = z
    .object({ id: z.uuid(), approve: z.boolean(), note: z.string().trim().max(300).optional() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid_request' }, { status: 400 });
  const { id, approve, note } = parsed.data;

  const sb = db();
  const { data, error } = await sb.rpc('apply_contribution', {
    p_id: id,
    p_reviewer: viewer?.id as string,
    p_approve: approve,
    p_note: note ?? undefined,
  });
  if (error) return Response.json({ error: error.message }, { status: 409 });
  const result = data as { status: string; slug?: string; place_id?: string };

  // New or renamed places get their meaning vector now, so they show up for meaning searches.
  const placeId = result.place_id;
  if (approve && placeId) {
    after(async () => {
      const { embedder } = ai();
      if (!embedder) return;
      const { data: input } = await sb.rpc(
        'place_embedding_input' as never,
        { p_id: placeId } as never,
      );
      if (typeof input !== 'string' || !input) return;
      const { vectors } = await embedder.embed([input]);
      const v = vectors[0];
      if (!v) return;
      await sb.rpc('set_embeddings', {
        p_ids: [placeId],
        p_vectors: [`[${v.map((x) => x.toFixed(5)).join(',')}]`],
      });
    });
  }
  return Response.json(result);
}
