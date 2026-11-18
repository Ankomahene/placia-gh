import 'server-only';
import { createServiceClient } from '@placia/db';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * The admin is for people whose profile role is "admin", nobody else. Three locks use this: the
 * proxy (every request), the console layout (every page) and each server action. Sign-in never
 * creates accounts here; an admin signs up on the main site first and is promoted.
 */

export interface Admin {
  id: string;
  email: string | null;
}

/** The request's Supabase client: anon key + this site's session cookie. */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
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

/** Service-role client for role lookups. Null when the database isn't configured. */
export function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createServiceClient(url, key) : null;
}

/** True when this user id has the admin role. Read with the service key, not the user's. */
export async function isAdminId(id: string) {
  const db = serviceDb();
  if (!db) return false;
  const { data } = await db.from('profiles').select('role').eq('id', id).maybeSingle();
  return data?.role === 'admin';
}

/** The verified user (Supabase Auth checks the token, not just the cookie) if they are an admin. */
export async function getAdmin(sb?: SupabaseClient): Promise<Admin | null> {
  const client = sb ?? (await supabaseServer());
  const { data } = await client.auth.getUser();
  if (!data.user || !(await isAdminId(data.user.id))) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/** For pages and server actions: the admin, or off to sign-in. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect('/signin');
  return admin;
}
