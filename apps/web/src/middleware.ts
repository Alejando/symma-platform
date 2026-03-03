import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isTokenExpired = req.auth?.error === 'TokenExpired';
  const { pathname } = req.nextUrl;

  // Protected routes - redirect if not logged in OR token expired
  if (pathname.startsWith('/dashboard')) {
    if (!isLoggedIn || isTokenExpired) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Redirect logged-in users from login to dashboard (only if token is valid)
  if (pathname === '/login' && isLoggedIn && !isTokenExpired) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect root to dashboard or login
  if (pathname === '/') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
