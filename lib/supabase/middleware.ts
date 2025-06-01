import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Define route patterns
const PROTECTED_ROUTES = ['/dashboard', '/admin'];
const AUTH_ROUTES = '/auth';
const ALLOWED_AUTH_ROUTES_FOR_LOGGED_IN = ['/auth/reset-password'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user session (DO NOT REMOVE OR ADD CODE BEFORE THIS)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = pathname.startsWith(AUTH_ROUTES);
  const isAllowedAuthRoute =
    ALLOWED_AUTH_ROUTES_FOR_LOGGED_IN.includes(pathname);

  // Handle unauthenticated users
  if (!user) {
    // Redirect to login if trying to access protected routes
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // Allow unauthenticated access to auth routes and public routes
    return response;
  }

  // For authenticated users, fetch their profile for role-based redirects
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_login')
    .eq('id', user.id)
    .single();

  // Handle authenticated users
  if (profile) {
    // First-time admin login should be forced to reset password
    if (
      profile.role === 'admin' &&
      profile.first_login === true &&
      pathname !== '/auth/reset-password'
    ) {
      return NextResponse.redirect(
        new URL('/auth/reset-password', request.url)
      );
    }

    // // Redirect admins to admin dashboard
    if (profile.role === 'admin' && !pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Prevent non-admins from accessing admin routes
    if (profile.role !== 'admin' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Redirect authenticated users away from auth pages (with exceptions)
    if (isAuthRoute && !isAllowedAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}
