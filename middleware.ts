/**
 * Middleware — Route Protection
 * Validates JWT sessions and protects dashboard routes.
 * Per Next.js 16 docs, this runs on the Edge runtime.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionTokenFromRequest, verifySessionToken } from '@/lib/auth-edge';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for session token
  const token = getSessionTokenFromRequest(request);
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify JWT (lightweight check — full DB check happens in getCurrentUser)
  const payload = await verifySessionToken(token);
  if (!payload) {
    // Clear invalid cookie and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session-token');
    return response;
  }

  // Attach user info to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
