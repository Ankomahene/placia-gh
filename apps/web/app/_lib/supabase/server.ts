import 'server-only';
import type { Database } from '@placia/db';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '../db';

/** The request's user client (anon key + session cookie): row-level security applies. */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            for (const c of list) store.set(c.name, c.value, c.options);
          } catch {
            // Server components can't set cookies; the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}

export interface Viewer {
  id: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'moderator' | 'admin';
}

/** The signed-in user, verified with Supabase Auth (not just read from the cookie), or null. */
export async function getViewer(): Promise<Viewer | null> {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await db()
    .from('profiles')
    .select('display_name, role')
    .eq('id', data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    displayName: profile?.display_name ?? null,
    role: (profile?.role as Viewer['role']) ?? 'user',
  };
}

export const isModerator = (v: Viewer | null) => v?.role === 'moderator' || v?.role === 'admin';
