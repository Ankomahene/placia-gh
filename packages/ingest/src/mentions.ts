import { createServiceClient } from '@placia/db';
import { log } from './duck';

/**
 * Rebuilds `area_mentions`: clusters of places whose name or address names a town ("Atonsu,
 * Lake Road"). The query parser uses them to tell same-name towns apart and to find suburbs
 * the gazetteer lacks. Runs in Postgres (~10 s); see migration 20261114001000.
 */
export async function mentions() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const sb = createServiceClient(url, key);
  const t = Date.now();
  const { data, error } = await sb.rpc('refresh_area_mentions');
  if (error) throw new Error(`refresh_area_mentions: ${error.message}`);
  log('mentions', `${data} town-name clusters in ${Math.round((Date.now() - t) / 1000)} s`);
}
