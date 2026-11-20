import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-auth';
import { isSupabaseConfigured } from '@/lib/supabase/types';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Expose pathname to Server Components so layouts can conditionally render.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Protect every /admin/* route except the login page + login API
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';

  if (isAdminRoute) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const valid = await verifyAdminToken(token);

    // Not logged in + trying to access an admin page → redirect to login
    if (!valid && !isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      if (pathname !== '/admin') {
        url.searchParams.set('next', pathname + request.nextUrl.search);
      }
      return NextResponse.redirect(url);
    }

    // Already logged in + hitting /admin/login → bounce to /admin
    if (valid && isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }

    // Allow the admin request through without Supabase cookie refresh —
    // admin pages use the server-role client directly.
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // No Supabase env (e.g. fresh local checkout): the data layer falls back to
  // static posts, so skip the Supabase client instead of throwing on every request.
  if (!isSupabaseConfigured()) return NextResponse.next();

  // Default: continue with Supabase session refresh
  return createClient(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
