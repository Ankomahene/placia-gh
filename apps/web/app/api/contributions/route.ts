import { type PrecheckInput, precheck } from '@placia/core/contrib';
import { ownsPhoto, PhotoRef } from '@placia/core/photos';
import { after } from 'next/server';
import { z } from 'zod';
import { ai } from '../../_lib/ai';
import { db } from '../../_lib/db';
import { parsePoint } from '../../_lib/format';
import { rateLimited } from '../../_lib/rate-limit';
import { getViewer } from '../../_lib/supabase/server';

/**
 * POST /api/contributions: a signed-in user suggests a new place, an edit, a report or a photo.
 * Saved as pending; the AI pre-check runs after the response so the user isn't kept waiting,
 * and a moderator decides in /review.
 */

const text = (max: number) => z.string().trim().max(max);
const lat = z.number().min(4.5).max(11.3); // Ghana, with a margin
const lon = z.number().min(-3.4).max(1.3);

/** Photos sent along with a suggestion; approved together with it (see apply_contribution). */
const Photos = z.array(PhotoRef).max(4).optional();

const Fields = z.object({
  name: text(120).min(2),
  category_id: z.number().int().positive(),
  phone: text(30).optional(),
  website: text(200).optional(),
  address: text(200).optional(),
  hours: text(200).optional(),
});

const Body = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('new_place'),
    payload: Fields.extend({
      lat,
      lon,
      note: text(500).optional(),
      photos: Photos,
    }),
  }),
  z.object({
    kind: z.literal('edit'),
    place_id: z.uuid(),
    payload: z.object({
      changes: Fields.partial().extend({ lat: lat.optional(), lon: lon.optional() }),
      note: text(500).optional(),
      photos: Photos,
    }),
  }),
  z.object({
    kind: z.literal('report'),
    place_id: z.uuid(),
    payload: z.object({
      reason: z.enum(['closed', 'not_here', 'duplicate', 'wrong_info', 'other']),
      note: text(500).optional(),
    }),
  }),
  z.object({
    kind: z.literal('photo'),
    place_id: z.uuid(),
    payload: PhotoRef,
  }),
]);

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: 'sign_in' }, { status: 401 });
  if (rateLimited(req, `contrib:${viewer.id}`, 30, 60 * 60_000)) {
    return Response.json({ error: 'too_many_requests' }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_request', issues: parsed.error.issues.map((i) => i.path.join('.')) },
      { status: 400 },
    );
  }
  const b = parsed.data;
  if (
    b.kind === 'edit' &&
    Object.keys(b.payload.changes).length === 0 &&
    !b.payload.photos?.length
  ) {
    return Response.json({ error: 'no_changes' }, { status: 400 });
  }
  // Photos must be files this user uploaded into their own folder.
  const sent =
    b.kind === 'photo' ? [b.payload] : b.kind === 'report' ? [] : (b.payload.photos ?? []);
  if (!sent.every((p) => ownsPhoto(p, viewer.id))) {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }

  const sb = db();
  let current: Record<string, unknown> | null = null;
  if (b.kind !== 'new_place') {
    const { data } = await sb
      .from('places')
      .select('id, name, category_id, phone, website, address, opening_hours, location, status')
      .eq('id', b.place_id)
      .maybeSingle();
    if (!data) return Response.json({ error: 'place_not_found' }, { status: 404 });
    const { location, ...rest } = data;
    current = { ...rest, ...parsePoint(location) };
  }

  const { data: row, error } = await sb
    .from('contributions')
    .insert({
      user_id: viewer.id,
      kind: b.kind,
      place_id: b.kind === 'new_place' ? null : b.place_id,
      payload: b.payload,
    })
    .select('id')
    .single();
  if (error || !row) {
    console.error('contribution insert failed', error);
    return Response.json({ error: 'save_failed' }, { status: 500 });
  }

  if (b.kind === 'photo') {
    const { error: photoErr } = await sb.from('place_photos').insert({
      place_id: b.place_id,
      user_id: viewer.id,
      storage_path: b.payload.storage_path ?? null,
      cloudinary_public_id: b.payload.cloudinary_public_id ?? null,
      width: b.payload.width,
      height: b.payload.height,
      contribution_id: row.id,
    });
    if (photoErr) console.error('photo row failed', photoErr);
  }

  after(async () => {
    const { llm } = ai();
    if (!llm) return;
    // File paths mean nothing to the text pre-check; it only hears how many photos came along.
    const submitted =
      (b.kind === 'new_place' || b.kind === 'edit') && b.payload.photos
        ? { ...b.payload, photos: b.payload.photos.length }
        : b.payload;
    const input: PrecheckInput = { kind: b.kind, submitted, current };
    const point =
      b.kind === 'new_place'
        ? { lat: b.payload.lat, lon: b.payload.lon, name: b.payload.name }
        : b.kind === 'edit' && current
          ? {
              lat: (current.lat as number) ?? 0,
              lon: (current.lon as number) ?? 0,
              name: b.payload.changes.name ?? (current.name as string),
            }
          : null;
    if (point) {
      const { data } = await sb.rpc(
        'search_places' as never,
        {
          p_text: point.name,
          p_lat: point.lat,
          p_lon: point.lon,
          p_radius_m: 400,
          p_limit: 6,
        } as never,
      );
      input.nearby = (
        (data as
          | { id: string; name: string; category: string | null; distance_m: number | null }[]
          | null) ?? []
      )
        .filter((r) => r.id !== (current?.id as string | undefined))
        .map((r) => ({ id: r.id, name: r.name, category: r.category, distance_m: r.distance_m }));
    }
    const review = await precheck(llm, input);
    await sb
      .from('contributions')
      .update({
        ai_review: (review ?? { verdict: 'needs_check', error: 'ai_unavailable' }) as never,
      })
      .eq('id', row.id);
  });

  return Response.json({ id: row.id }, { status: 201 });
}
