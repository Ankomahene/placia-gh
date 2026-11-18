/**
 * Place photos live in Cloudinary (main: more free storage and on-the-fly resizing) or, when
 * Cloudinary isn't configured or an upload fails, in the Supabase Storage bucket "place-photos".
 *
 * A photo is referenced by one string:
 *   Cloudinary: its public id, always "placia/<user-id>/<uuid>"
 *   Supabase:   its storage path, "<user-id>/<uuid>.webp|jpg"
 * Uploads happen in the browser; the server only signs Cloudinary uploads, so the API secret
 * never leaves it. Each user can only upload into, and submit photos from, their own folder.
 */
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';

export const CLOUDINARY_FOLDER = 'placia';
export const PHOTO_BUCKET = 'place-photos';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const STORAGE_PATH = new RegExp(`^${UUID}/${UUID}\\.(webp|jpg)$`);
const PUBLIC_ID = new RegExp(`^${CLOUDINARY_FOLDER}/${UUID}/${UUID}$`);

/** A photo as the browser reports it after uploading: exactly one of the two references. */
export const PhotoRef = z
  .object({
    storage_path: z.string().regex(STORAGE_PATH).optional(),
    cloudinary_public_id: z.string().regex(PUBLIC_ID).optional(),
    width: z.number().int().positive().max(8000),
    height: z.number().int().positive().max(8000),
  })
  .refine((p) => !!p.storage_path !== !!p.cloudinary_public_id, 'one reference');
export type PhotoRef = z.infer<typeof PhotoRef>;

/** The single string that identifies a photo (what places.cover_photo_id holds). */
export const photoKey = (p: {
  storage_path?: string | null;
  cloudinary_public_id?: string | null;
}) => p.cloudinary_public_id || p.storage_path || '';

/** True when the photo sits in this user's own folder, in either store. */
export const ownsPhoto = (p: PhotoRef, userId: string) =>
  p.cloudinary_public_id
    ? p.cloudinary_public_id.startsWith(`${CLOUDINARY_FOLDER}/${userId}/`)
    : !!p.storage_path?.startsWith(`${userId}/`);

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

type Env = Record<string, string | undefined>;

/** From CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET, or the dashboard's CLOUDINARY_URL. */
export function cloudinaryFromEnv(env: Env = process.env): CloudinaryConfig | null {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    return {
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
    };
  }
  const m = env.CLOUDINARY_URL?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  return m
    ? { apiKey: m[1] as string, apiSecret: m[2] as string, cloudName: m[3] as string }
    : null;
}

/** The cloud name alone (not secret), for building image URLs. */
export const cloudName = (env: Env = process.env) =>
  env.CLOUDINARY_CLOUD_NAME || cloudinaryFromEnv(env)?.cloudName || null;

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  publicId: string;
  timestamp: number;
  signature: string;
}

/**
 * Signs one upload to a fixed public id in the user's folder. The browser can't change the id
 * (it's part of the signature), and Cloudinary rejects signatures older than an hour.
 */
export function signCloudinaryUpload(cfg: CloudinaryConfig, userId: string): SignedUpload {
  const publicId = `${CLOUDINARY_FOLDER}/${userId}/${randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash('sha1')
    .update(toSign + cfg.apiSecret)
    .digest('hex');
  return { cloudName: cfg.cloudName, apiKey: cfg.apiKey, publicId, timestamp, signature };
}

/**
 * Public URL for a photo key. Cloudinary images are resized and converted on delivery
 * (f_auto picks WebP/AVIF per browser); Supabase files are served as uploaded.
 */
export function photoUrl(
  key: string,
  opts: { width?: number; supabaseUrl?: string; cloud?: string | null } = {},
) {
  if (key.startsWith(`${CLOUDINARY_FOLDER}/`)) {
    const cloud = opts.cloud ?? cloudName();
    const size = opts.width ? `,c_limit,w_${opts.width}` : '';
    return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto${size}/${key}`;
  }
  const base = opts.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${key}`;
}

/**
 * Deletes a photo from Cloudinary (signed with the API secret, server only). Resolves true when
 * it's gone, including when it was already gone.
 */
export async function destroyCloudinaryPhoto(
  cfg: CloudinaryConfig,
  publicId: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!PUBLIC_ID.test(publicId)) return false;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash('sha1')
    .update(`invalidate=true&public_id=${publicId}&timestamp=${timestamp}${cfg.apiSecret}`)
    .digest('hex');
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    invalidate: 'true',
    api_key: cfg.apiKey,
    signature,
  });
  const res = await fetcher(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, {
    method: 'POST',
    body,
  });
  if (!res.ok) return false;
  const out = (await res.json().catch(() => null)) as { result?: string } | null;
  return out?.result === 'ok' || out?.result === 'not found';
}
