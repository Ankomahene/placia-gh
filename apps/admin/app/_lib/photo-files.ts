import 'server-only';
import { cloudinaryFromEnv, destroyCloudinaryPhoto, PHOTO_BUCKET } from '@placia/core/photos';
import type { serviceDb } from './auth';

type Db = NonNullable<ReturnType<typeof serviceDb>>;

export interface StoredPhoto {
  cloudinary_public_id: string | null;
  storage_path: string | null;
}

/**
 * Deletes photo files from Cloudinary or Supabase Storage after their rows are gone. A file left
 * behind only costs storage, so failures are logged, not thrown.
 */
export async function deletePhotoFiles(db: Db, photos: StoredPhoto[]) {
  const cfg = cloudinaryFromEnv();
  const paths = photos
    .map((p) => p.storage_path)
    .filter((p): p is string => !!p && !p.startsWith('placia/'));
  await Promise.all(
    photos
      .map((p) => p.cloudinary_public_id)
      .filter((id): id is string => !!id)
      .map(async (id) => {
        const ok = cfg ? await destroyCloudinaryPhoto(cfg, id).catch(() => false) : false;
        if (!ok) console.error('cloudinary delete failed', id);
      }),
  );
  if (paths.length) {
    const { error } = await db.storage.from(PHOTO_BUCKET).remove(paths);
    if (error) console.error('storage delete failed', error.message);
  }
}

/** Marks places as corrected by an admin, so the next data import leaves them as they are. */
export async function markAdminEdited(db: Db, ids: string[]) {
  if (!ids.length) return;
  const { error } = await db
    .from('places')
    .update({ admin_edited_at: new Date().toISOString() })
    .in('id', ids);
  if (error) console.error('admin_edited_at failed', error.message);
}
