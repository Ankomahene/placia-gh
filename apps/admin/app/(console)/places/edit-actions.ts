'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin, serviceDb } from '../../_lib/auth';
import { reembedLater } from '../../_lib/embed';

const text = (max: number) => z.string().trim().max(max);

/**
 * A place as the editor sends it. Only fields that changed are sent on an edit (hours and the
 * position in particular), so untouched OSM opening hours and areas stay as they are.
 */
const PlaceInput = z
  .object({
    name: text(150).min(2),
    alt_names: z.array(text(150).min(1)).max(10),
    category_id: z.number().int().positive().nullable(),
    // Ghana and a margin around it.
    lat: z.number().min(4).max(12),
    lon: z.number().min(-4).max(2),
    address: text(300),
    phone: text(60),
    website: text(300),
    email: z.union([z.literal(''), z.email().max(200)]),
    hours: text(300),
    description: text(1000),
    status: z.enum(['active', 'pending', 'hidden', 'closed']),
  })
  .partial()
  .extend({ id: z.uuid().nullable() });

export type PlaceInput = z.input<typeof PlaceInput>;

export async function savePlace(
  input: PlaceInput,
): Promise<{ id: string; slug: string } | { error: string }> {
  const admin = await requireAdmin();
  const db = serviceDb();
  const parsed = PlaceInput.safeParse(input);
  if (!db) return { error: 'Database not connected' };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the fields' };
  const { id, ...fields } = parsed.data;
  if (!id && (!fields.name || fields.lat == null || fields.lon == null)) {
    return { error: 'Name and location are required' };
  }
  if ((fields.lat == null) !== (fields.lon == null)) return { error: 'Location is incomplete' };

  const { data, error } = await db.rpc('admin_save_place', {
    p_id: id as string,
    p: fields,
    p_admin: admin.id,
  });
  if (error || !data) {
    console.error('admin_save_place failed', error?.message);
    return { error: "Couldn't save" };
  }
  const out = data as { id: string; slug: string };
  reembedLater(db, [out.id]);
  revalidatePath('/places');
  revalidatePath('/duplicates');
  return out;
}

/** Fold `drop` into `keep`: its sources, photos, saves and contributions move over. */
export async function mergePlaces(form: FormData): Promise<void> {
  await requireAdmin();
  const db = serviceDb();
  const ids = z
    .object({ keep: z.uuid(), drop: z.uuid(), back: z.enum(['duplicates', 'keep']).optional() })
    .refine((v) => v.keep !== v.drop)
    .safeParse({
      keep: form.get('keep'),
      drop: form.get('drop'),
      back: form.get('back') || undefined,
    });
  if (!db || !ids.success) return;
  const { keep, drop, back } = ids.data;
  const { error } = await db.rpc('merge_places', { p_keep: keep, p_drop: drop });
  if (error) {
    console.error('merge_places failed', error.message);
    return;
  }
  await db.rpc('forget_duplicate_pairs', { p_ids: [drop] });
  reembedLater(db, [keep]);
  revalidatePath('/places');
  revalidatePath('/duplicates');
  if (back === 'keep') redirect(`/places/${keep}?merged=1`);
}

/** Two look-alikes that are really different places: stop suggesting them. */
export async function markNotDuplicates(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const db = serviceDb();
  const ids = z
    .tuple([z.uuid(), z.uuid()])
    .refine(([x, y]) => x !== y)
    .safeParse([form.get('a'), form.get('b')]);
  if (!db || !ids.success) return;
  const [a, b] = ids.data.sort();
  await db
    .from('place_not_duplicates')
    .upsert({ a: a as string, b: b as string, decided_by: admin.id }, { ignoreDuplicates: true });
  await db
    .from('place_duplicate_pairs')
    .delete()
    .eq('a', a as string)
    .eq('b', b as string);
  revalidatePath('/duplicates');
  revalidatePath('/places');
}

/** Look for look-alikes again across all places, in 16 short slices. */
export async function rescanDuplicates(): Promise<void> {
  await requireAdmin();
  const db = serviceDb();
  if (!db) return;
  const slices = [...'0123456789abcdef'];
  // Four at a time: a few seconds each, without crowding the database.
  for (let i = 0; i < slices.length; i += 4) {
    await Promise.all(
      slices.slice(i, i + 4).map(async (slice) => {
        const { error } = await db.rpc('refresh_duplicate_pairs', { p_slice: slice });
        if (error) console.error('refresh_duplicate_pairs failed', slice, error.message);
      }),
    );
  }
  revalidatePath('/duplicates');
}
