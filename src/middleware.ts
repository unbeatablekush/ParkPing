import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('session_token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  
  // Paths that require auth
  const protectedPaths = ['/dashboard', '/register'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  // 1 & 2 & 3: Check if session cookie exists -> if no cookie redirect to /auth
  if (isProtectedPath && !hasSession) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // 4: Redirect logged in users away from /auth to /dashboard
  if (isAuthPage && hasSession) {
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
