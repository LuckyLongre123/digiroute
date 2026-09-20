import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'digiroute_session';
const ADMIN_TOKEN_COOKIE = 'digiroute_admin_token';

/**
 * DigiRoute Strict Security Middleware (middleware.ts)
 *
 * 1. Strict Dashboard Protection:
 *    - Validates presence of digiroute_session cookie.
 *    - Cryptographically verifies the JWT signature with jose on Edge Runtime.
 *    - If cookie is missing or invalid/expired, immediately redirects to / (Home)
 *      and purges any invalid cookie.
 *
 * 2. Auth Route Handling (/login, /register):
 *    - If user already has a valid verified session token, redirects to /dashboard.
 *    - If cookie is invalid or expired, purges the stale cookie so the user can access /login.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Admin Route Guard — lightweight presence check on Edge, cryptographic verification in Server Components & APIs
  if (pathname.startsWith('/admin')) {
    // Prevent redirect loop: strictly ignore /admin/login
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const adminCookie = request.cookies.get(ADMIN_TOKEN_COOKIE);
    if (!adminCookie?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // 1. Strict Dashboard Route Guard
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Middleware] JWT_SECRET is not configured.');
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const secretKey = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(sessionCookie.value, secretKey, {
        algorithms: ['HS256'],
      });

      if (!payload || !payload.id) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
      }
    } catch {
      // Invalid, expired, or tampered token: strictly redirect to / (Home) and purge cookie
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  }

  // 2. Auth Routes (/login, /register) Guard
  if (pathname === '/login' || pathname === '/register') {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie?.value) {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        try {
          const secretKey = new TextEncoder().encode(secret);
          const { payload } = await jwtVerify(sessionCookie.value, secretKey, {
            algorithms: ['HS256'],
          });

          if (payload?.id) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        } catch {
          // Token is invalid/expired: clear stale cookie so user can cleanly access the auth UI
          const response = NextResponse.next();
          response.cookies.delete(SESSION_COOKIE_NAME);
          return response;
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
