import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  cloudinaryFromEnv,
  destroyCloudinaryPhoto,
  ownsPhoto,
  PhotoRef,
  photoKey,
  photoUrl,
  signCloudinaryUpload,
} from './photos';

const U = '11111111-2222-3333-4444-555555555555';
const OTHER = '99999999-2222-3333-4444-555555555555';
const ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('photos', () => {
  it('reads either the three variables or CLOUDINARY_URL', () => {
    expect(cloudinaryFromEnv({})).toBeNull();
    expect(cloudinaryFromEnv({ CLOUDINARY_URL: 'cloudinary://k:s@demo' })).toEqual({
      cloudName: 'demo',
      apiKey: 'k',
      apiSecret: 's',
    });
    expect(
      cloudinaryFromEnv({
        CLOUDINARY_CLOUD_NAME: 'c',
        CLOUDINARY_API_KEY: 'k',
        CLOUDINARY_API_SECRET: 's',
      })?.cloudName,
    ).toBe('c');
  });

  it('signs a fixed public id in the user folder', () => {
    const s = signCloudinaryUpload({ cloudName: 'c', apiKey: 'k', apiSecret: 'secret' }, U);
    expect(s.publicId).toMatch(new RegExp(`^placia/${U}/[0-9a-f-]{36}$`));
    const expected = createHash('sha1')
      .update(`public_id=${s.publicId}&timestamp=${s.timestamp}secret`)
      .digest('hex');
    expect(s.signature).toBe(expected);
  });

  it('accepts exactly one reference and checks the owner folder', () => {
    const cld = { cloudinary_public_id: `placia/${U}/${ID}`, width: 10, height: 10 };
    const sup = { storage_path: `${U}/${ID}.webp`, width: 10, height: 10 };
    expect(PhotoRef.safeParse(cld).success).toBe(true);
    expect(PhotoRef.safeParse(sup).success).toBe(true);
    expect(PhotoRef.safeParse({ ...cld, ...sup }).success).toBe(false);
    expect(PhotoRef.safeParse({ width: 1, height: 1 }).success).toBe(false);
    expect(PhotoRef.safeParse({ ...cld, cloudinary_public_id: `other/${U}/${ID}` }).success).toBe(
      false,
    );
    expect(ownsPhoto(cld, U)).toBe(true);
    expect(ownsPhoto(sup, U)).toBe(true);
    expect(ownsPhoto(cld, OTHER)).toBe(false);
    expect(ownsPhoto(sup, OTHER)).toBe(false);
  });

  it('builds URLs for both stores', () => {
    expect(photoKey({ storage_path: 'a', cloudinary_public_id: null })).toBe('a');
    expect(photoUrl(`placia/${U}/${ID}`, { cloud: 'demo', width: 800 })).toBe(
      `https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_800/placia/${U}/${ID}`,
    );
    expect(photoUrl(`${U}/${ID}.webp`, { supabaseUrl: 'https://x.supabase.co' })).toBe(
      `https://x.supabase.co/storage/v1/object/public/place-photos/${U}/${ID}.webp`,
    );
  });

  it('signs a Cloudinary delete and accepts already-gone photos', async () => {
    let sent: URLSearchParams | null = null;
    const fake = (async (_url: string, init: { body: URLSearchParams }) => {
      sent = init.body;
      return new Response(JSON.stringify({ result: 'not found' }));
    }) as unknown as typeof fetch;
    const cfg = { cloudName: 'demo', apiKey: 'k', apiSecret: 's' };
    expect(await destroyCloudinaryPhoto(cfg, `placia/${U}/${ID}`, fake)).toBe(true);
    expect((sent as URLSearchParams | null)?.get('signature')).toMatch(/^[0-9a-f]{40}$/);
    expect(await destroyCloudinaryPhoto(cfg, 'elsewhere/x', fake)).toBe(false);
  });
});
