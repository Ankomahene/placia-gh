import { createServiceClient } from '@placia/db';
import { log } from './duck';

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  return createServiceClient(url, key);
}

async function refresh(fn: 'refresh_area_mentions' | 'refresh_place_acronyms', what: string) {
  const t = Date.now();
  const { data, error } = await client().rpc(fn);
  if (error) throw new Error(`${fn}: ${error.message}`);
  log(
    fn === 'refresh_area_mentions' ? 'mentions' : 'acronyms',
    `${data} ${what} in ${Math.round((Date.now() - t) / 1000)} s`,
  );
}

/**
 * Rebuilds `area_mentions`: clusters of places whose name or address names a town ("Atonsu,
 * Lake Road"). The query parser uses them to tell same-name towns apart and to find suburbs
 * the gazetteer lacks. Runs in Postgres (~10 s); see migration 20261114001000.
 */
export const mentions = () => refresh('refresh_area_mentions', 'town-name clusters');

/**
 * Rebuilds `place_acronyms`: initials of place names that people use ("kbth" → Korle Bu
 * Teaching Hospital). The query parser expands them. Runs in Postgres; see migration
 * 20261114001100.
 */
export const acronyms = () => refresh('refresh_place_acronyms', 'acronyms');
