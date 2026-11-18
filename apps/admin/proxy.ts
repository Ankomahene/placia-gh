import { createServiceClient } from '@placia/db';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * First lock: every request except sign-in and static files needs a signed-in admin. Anyone else
 * goes to /signin; a signed-in non-admin is signed out on the way. Also refreshes the session.
 */
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          for (const c of list) req.cookies.set(c.name, c.value);
          res = NextResponse.next({ request: req });
          for (const c of list) res.cookies.set(c.name, c.value, c.options);
        },
      },
    },
  );
  const { data } = await sb.auth.getUser();
  const isSignIn = req.nextUrl.pathname === '/signin';

  let admin = false;
  if (data.user) {
    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    admin = profile?.role === 'admin';
  }

  if (admin) return isSignIn ? NextResponse.redirect(new URL('/', req.url)) : res;
  if (isSignIn) return res;

  const to = NextResponse.redirect(new URL('/signin', req.url));
  if (data.user) {
    // Signed in, but not an admin: drop the session so they can sign in as someone else.
    for (const c of req.cookies.getAll()) if (c.name.startsWith('sb-')) to.cookies.delete(c.name);
  }
  return to;
}

export const config = {
  // Everything but Next's own files and icons.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt).*)'],
};
