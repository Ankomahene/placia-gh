import 'server-only';
import { createServiceClient } from '@placia/db';

let client: ReturnType<typeof createServiceClient> | null = null;

/** Server-side database client. Never imported by client components ("server-only"). */
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured');
  client ??= createServiceClient(url, key);
  return client;
}
