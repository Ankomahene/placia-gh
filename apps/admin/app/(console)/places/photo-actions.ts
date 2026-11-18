'use server';

import {
  cloudinaryFromEnv,
  ownsPhoto,
  PhotoRef,
  type SignedUpload,
  signCloudinaryUpload,
} from '@placia/core/photos';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, serviceDb } from '../../_lib/auth';
import { deletePhotoFiles, type StoredPhoto } from '../../_lib/photo-files';

/** A signed Cloudinary upload into the admin's own folder; null when Cloudinary isn't set up. */
export async function signPhotoUpload(): Promise<SignedUpload | null> {
  const admin = await requireAdmin();
  const cfg = cloudinaryFromEnv();
  return cfg ? signCloudinaryUpload(cfg, admin.id) : null;
}

const Input = z.object({ placeId: z.uuid(), photos: z.array(PhotoRef).min(1).max(10) });

/** Admin photos go live at once: no review queue. Returns how many were added. */
export async function addPlacePhotos(placeId: string, photos: unknown): Promise<number> {
  const admin = await requireAdmin();
  const parsed = Input.safeParse({ placeId, photos });
  const db = serviceDb();
  if (!parsed.success || !db) return 0;
  if (!parsed.data.photos.every((p) => ownsPhoto(p, admin.id))) return 0;
  const { data, error } = await db.rpc(
    'attach_place_photos' as never,
    {
      p_place: parsed.data.placeId,
      p_user: admin.id,
      p_photos: parsed.data.photos,
    } as never,
  );
  if (error) {
    console.error('attach_place_photos failed', error.message);
    return 0;
  }
  revalidatePath('/places');
  return Number(data) || 0;
}

const PhotoId = z.uuid();

/** Removes a photo from the place and deletes the file from wherever it's stored. */
export async function removePlacePhoto(photoId: string): Promise<boolean> {
  await requireAdmin();
  const db = serviceDb();
  const id = PhotoId.safeParse(photoId);
  if (!db || !id.success) return false;
  const { data, error } = await db.rpc('remove_place_photo', { p_photo: id.data });
  if (error) {
    console.error('remove_place_photo failed', error.message);
    return false;
  }
  const gone = data as StoredPhoto | null;
  if (gone) await deletePhotoFiles(db, [gone]);
  revalidatePath('/places');
  return true;
}

/** Makes this photo the place's cover (its first photo). */
export async function setPlaceCover(photoId: string): Promise<boolean> {
  await requireAdmin();
  const db = serviceDb();
  const id = PhotoId.safeParse(photoId);
  if (!db || !id.success) return false;
  const { error } = await db.rpc('set_place_cover', { p_photo: id.data });
  revalidatePath('/places');
  return !error;
}

/** Moves a photo that was added to the wrong place onto the right one. */
export async function movePlacePhoto(photoId: string, toPlaceId: string): Promise<boolean> {
  await requireAdmin();
  const db = serviceDb();
  const ids = z.tuple([z.uuid(), z.uuid()]).safeParse([photoId, toPlaceId]);
  if (!db || !ids.success) return false;
  const { error } = await db.rpc('move_place_photo', {
    p_photo: ids.data[0],
    p_to: ids.data[1],
  });
  if (error) console.error('move_place_photo failed', error.message);
  revalidatePath('/places');
  return !error;
}

/** Places by name for pickers (moving a photo, choosing a merge target). */
export async function findPlaces(
  q: string,
): Promise<{ id: string; name: string; area: string; status: string }[]> {
  await requireAdmin();
  const db = serviceDb();
  const term = q.trim().slice(0, 100);
  if (!db || term.length < 2) return [];
  const { data } = await db
    .from('places')
    .select('id, name, status, localities(name), districts(name)')
    .ilike('name', `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
    .is('merged_into', null)
    .order('name')
    .limit(8);
  return (
    (data ?? []) as unknown as {
      id: string;
      name: string;
      status: string;
      localities: { name: string } | null;
      districts: { name: string } | null;
    }[]
  ).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    area: [p.localities?.name, p.districts?.name].filter(Boolean).join(', '),
  }));
}
