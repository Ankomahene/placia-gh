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
