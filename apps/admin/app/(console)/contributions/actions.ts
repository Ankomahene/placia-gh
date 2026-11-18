'use server';

import { aiConfigFromEnv, createEmbedder } from '@placia/core/ai';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { requireAdmin, serviceDb } from '../../_lib/auth';

const Input = z.object({
  id: z.uuid(),
  decision: z.enum(['approve', 'reject']),
  note: z.string().trim().max(300).optional(),
});

/** Approve or reject a contribution: same transaction the public site's moderators use. */
export async function decideContribution(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = Input.safeParse({
    id: form.get('id'),
    decision: form.get('decision'),
    note: form.get('note') || undefined,
  });
  const db = serviceDb();
  if (!parsed.success || !db) return;
  const approve = parsed.data.decision === 'approve';
  const { data, error } = await db.rpc('apply_contribution', {
    p_id: parsed.data.id,
    p_reviewer: admin.id,
    p_approve: approve,
    p_note: parsed.data.note,
  });
  if (error) {
    console.error('apply_contribution failed', error.message);
    revalidatePath('/contributions');
    return;
  }

  // New or renamed places get their meaning vector, so they show up for meaning searches.
  const placeId = (data as { place_id?: string } | null)?.place_id;
  const cfg = aiConfigFromEnv();
  if (approve && placeId && cfg.openaiApiKey) {
    after(async () => {
      const { data: input } = await db.rpc(
        'place_embedding_input' as never,
        { p_id: placeId } as never,
      );
      if (typeof input !== 'string' || !input) return;
      const { vectors } = await createEmbedder(cfg).embed([input]);
      const v = vectors[0];
      if (!v) return;
      await db.rpc('set_embeddings', {
        p_ids: [placeId],
        p_vectors: [`[${v.map((x) => x.toFixed(5)).join(',')}]`],
      });
    });
  }
  revalidatePath('/contributions');
}
