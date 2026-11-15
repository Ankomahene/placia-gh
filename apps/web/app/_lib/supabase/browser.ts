'use client';

import type { Database } from '@placia/db';
import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** The signed-in user's client: anon key + session cookie, so row-level security applies. */
export function supabaseBrowser() {
  client ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
  return client;
}
