'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, serviceDb } from '../../_lib/auth';

const Input = z.object({
  id: z.uuid(),
  status: z.enum(['active', 'closed', 'hidden']),
});

/** Hide, close or restore a place. Hidden and closed places drop out of search. */
export async function setPlaceStatus(form: FormData) {
  await requireAdmin();
  const parsed = Input.safeParse({ id: form.get('id'), status: form.get('status') });
  const db = serviceDb();
  if (!parsed.success || !db) return;
  await db
    .from('places')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id);
  revalidatePath('/places');
}
