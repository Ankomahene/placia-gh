import { photoKey, photoUrl as url } from '@placia/core/photos';

export { photoKey } from '@placia/core/photos';

/** Public URL of a place photo (Cloudinary public id or Supabase storage path). */
export const photoUrl = (key: string, width?: number) => url(key, { width });

export interface PlacePhoto {
  /** Large copy for the viewer. */
  src: string;
  /** Small copy for thumbnails. */
  thumb: string;
  width: number | null;
  height: number | null;
}

interface PhotoRow {
  place_id?: string;
  storage_path: string | null;
  cloudinary_public_id: string | null;
  width: number | null;
  height: number | null;
}

/** A stored photo row as the viewer wants it. Cloudinary copies are resized on delivery. */
export const toPlacePhoto = (r: PhotoRow, thumbWidth = 240): PlacePhoto => ({
  src: photoUrl(photoKey(r), 1600),
  thumb: photoUrl(photoKey(r), thumbWidth),
  width: r.width,
  height: r.height,
});

type Db = {
  from: (t: 'place_photos') => {
    select: (cols: string) => {
      in: (
        col: string,
        ids: string[],
      ) => {
        eq: (
          col: string,
          v: string,
        ) => {
          order: (col: string) => PromiseLike<{ data: PhotoRow[] | null; error: unknown }>;
        };
      };
    };
  };
};

/**
 * Approved photos for many places in one query, oldest first (the first is the cover), at most
 * `per` each, plus each place's total. Places without photos are absent from the map.
 */
export async function photosFor(db: unknown, ids: string[], per = 4) {
  const out = new Map<string, { photos: PlacePhoto[]; count: number }>();
  if (!ids.length) return out;
  const { data } = await (db as Db)
    .from('place_photos')
    .select('place_id, storage_path, cloudinary_public_id, width, height')
    .in('place_id', ids)
    .eq('status', 'approved')
    .order('created_at');
  for (const r of data ?? []) {
    if (!r.place_id || !photoKey(r)) continue;
    const entry = out.get(r.place_id) ?? { photos: [], count: 0 };
    entry.count++;
    if (entry.photos.length < per) entry.photos.push(toPlacePhoto(r));
    out.set(r.place_id, entry);
  }
  return out;
}
