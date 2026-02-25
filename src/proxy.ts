import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// All routes are protected by default, except those explicitly listed as public
const publicRoutes = ['/'];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);
  const sessionCookie = getSessionCookie(req);

  // If not authenticated and not a public route, redirect to /login
  if (!isPublicRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // If authenticated and trying to access a public route (except /dashboard), redirect to /t
  if (isPublicRoute && sessionCookie && path !== '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Proxy should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
