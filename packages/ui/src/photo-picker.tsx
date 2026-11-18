'use client';

import { ImagePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Shrinks a photo on the phone before upload: a 12 MP picture becomes ~200 KB. */
export async function shrinkPhoto(file: File, max = 1600) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
  img.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.8));
  // Older Safari can't encode WebP and silently returns PNG: fall back to JPEG.
  if (blob && blob.type === 'image/webp') return { blob, w, h, ext: 'webp' as const };
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
  if (!jpeg) throw new Error('encode failed');
  return { blob: jpeg, w, h, ext: 'jpg' as const };
}

/** The part of a Supabase Storage bucket this needs, so the UI package doesn't depend on Supabase. */
export interface PhotoBucket {
  upload(
    path: string,
    body: Blob,
    options: { contentType: string; upsert: boolean },
  ): Promise<{ error: unknown }>;
}

/** A Cloudinary upload signed by our server (see @placia/core/photos). */
export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  publicId: string;
  timestamp: number;
  signature: string;
}

/** What an upload returns: exactly one of the two references. */
export interface UploadedPhoto {
  storage_path?: string;
  cloudinary_public_id?: string;
  width: number;
  height: number;
}

export interface PhotoTarget {
  /** The uploader's user id: their folder in either store. */
  userId: string;
  /** Asks our server to sign a Cloudinary upload; null when Cloudinary isn't set up. */
  sign: () => Promise<SignedUpload | null>;
  /** Supabase Storage fallback. */
  bucket: PhotoBucket;
}

async function toCloudinary(s: SignedUpload, blob: Blob) {
  const body = new FormData();
  body.append('file', blob);
  body.append('api_key', s.apiKey);
  body.append('timestamp', String(s.timestamp));
  body.append('public_id', s.publicId);
  body.append('signature', s.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, {
    method: 'POST',
    body,
  });
  if (!res.ok) throw new Error(`cloudinary ${res.status}`);
  const out = (await res.json()) as { public_id: string; width: number; height: number };
  return { cloudinary_public_id: out.public_id, width: out.width, height: out.height };
}

/** Shrinks one photo and uploads it: Cloudinary first, Supabase Storage if that's unavailable. */
export async function uploadPhoto(target: PhotoTarget, file: File): Promise<UploadedPhoto> {
  const { blob, w, h, ext } = await shrinkPhoto(file);
  try {
    const signed = await target.sign();
    if (signed) return await toCloudinary(signed, blob);
  } catch {
    // Cloudinary down, over quota or blocked: fall through to Supabase.
  }
  const path = `${target.userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await target.bucket.upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw error;
  return { storage_path: path, width: w, height: h };
}

/** Pick up to `max` photos: thumbnails with remove, plus an add tile (camera or gallery). */
export function PhotoPicker({
  files,
  onChange,
  max = 4,
  label = 'Photos',
}: {
  files: File[];
  onChange: (f: File[]) => void;
  max?: number;
  label?: string;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const u = files.map((f) => URL.createObjectURL(f));
    setUrls(u);
    return () => {
      for (const x of u) URL.revokeObjectURL(x);
    };
  }, [files]);
  return (
    <div className="space-y-1.5">
      <span className="font-medium text-sm">
        {label}{' '}
        <span className="text-muted-foreground tabular-nums">
          {files.length}/{max}
        </span>
      </span>
      <div className="grid grid-cols-4 gap-2">
        {urls.map((u, i) => (
          <div
            key={u}
            className="relative aspect-square overflow-hidden rounded-xl border bg-surface-2"
          >
            {/* biome-ignore lint/performance/noImgElement: a local preview, not a served image. */}
            <img src={u} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {files.length < max ? (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed bg-surface text-muted-foreground hover:border-primary hover:text-primary">
            <ImagePlus className="size-6" />
            <span className="sr-only">Add photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                const picked = [...(e.target.files ?? [])].filter((f) =>
                  f.type.startsWith('image/'),
                );
                onChange([...files, ...picked].slice(0, max));
                e.target.value = '';
              }}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
