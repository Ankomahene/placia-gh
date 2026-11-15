import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Refreshes the Supabase session cookie on pages that need the user. Public pages (home, search,
 * place) skip it, so they stay fast and cacheable.
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
  await sb.auth.getUser();
  return res;
}

export const config = {
  matcher: [
    '/account/:path*',
    '/saved/:path*',
    '/contribute/:path*',
    '/review/:path*',
    '/api/me/:path*',
  ],
};
