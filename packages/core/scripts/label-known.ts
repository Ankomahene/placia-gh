/**
 * Labelling helper for the eval golden set: does a landmark exist, and under which names?
 *   pnpm --filter @placia/core exec tsx --env-file=../../.env.local scripts/label-known.ts "%kakum%"
 */
import { createServiceClient } from '@placia/db';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
const sb = createServiceClient(url, key);

for (const pattern of process.argv.slice(2)) {
  const { data } = await sb
    .from('places')
    .select('name, category_id')
    .ilike('name', pattern)
    .limit(6);
  const names = (data ?? []).map((x) => x.name);
  console.log(`${pattern} → ${names.join(' | ') || 'NONE'}`);
}
