import { cloudinaryFromEnv, signCloudinaryUpload } from '@placia/core/photos';
import { rateLimited } from '../../../_lib/rate-limit';
import { getViewer } from '../../../_lib/supabase/server';

/**
 * POST /api/photos/sign: a signed Cloudinary upload into the viewer's own folder, or
 * { signed: null } when Cloudinary isn't configured (the browser then uses Supabase Storage).
 */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: 'sign_in' }, { status: 401 });
  if (rateLimited(req, `photo-sign:${viewer.id}`, 40, 60 * 60_000)) {
    return Response.json({ error: 'too_many_requests' }, { status: 429 });
  }
  const cfg = cloudinaryFromEnv();
  return Response.json({ signed: cfg ? signCloudinaryUpload(cfg, viewer.id) : null });
}
