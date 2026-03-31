import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simple check for our mocked authentication via a cookie named 'session_token'.
  // We'll simulate authentication by checking this cookie.
  const hasSession = request.cookies.has('session_token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  // Paths that require auth
  const protectedPaths = ['/dashboard', '/register'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !hasSession) {
    // If not logged in but trying to access a protected route, redirect to auth
    // For development/mock purposes, let's just bypass it if NEXT_PUBLIC_SUPABASE_URL is not set
    // In a real integration this fallback shouldn't be here
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
       console.log("Allowing offline bypass for", request.nextUrl.pathname);
       return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (isAuthPage && hasSession) {
    // If already logged in, no need to see auth page again
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
