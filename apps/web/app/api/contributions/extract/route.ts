import { extractPlace } from '@placia/core/contrib';
import { z } from 'zod';
import { ai } from '../../../_lib/ai';
import { categoryOptions } from '../../../_lib/categories';
import { rateLimited } from '../../../_lib/rate-limit';
import { getViewer } from '../../../_lib/supabase/server';

/** POST /api/contributions/extract { text } → form fields read from a plain description. */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: 'sign_in' }, { status: 401 });
  if (rateLimited(req, `extract:${viewer.id}`, 20, 10 * 60_000)) {
    return Response.json({ error: 'too_many_requests' }, { status: 429 });
  }
  const body = z
    .object({ text: z.string().trim().min(3).max(500) })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: 'invalid_request' }, { status: 400 });
  const { llm } = ai();
  if (!llm) return Response.json({ fields: null });
  const cats = await categoryOptions();
  const fields = await extractPlace(llm, body.data.text, cats);
  const category = fields?.category_slug ? cats.find((c) => c.slug === fields.category_slug) : null;
  return Response.json({ fields: fields && { ...fields, category_id: category?.id ?? null } });
}
