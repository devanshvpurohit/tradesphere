import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('firebase_token')?.value;
  const uid = request.cookies.get('tradesphere_uid')?.value;
  const demoId = request.cookies.get('demo_user_id')?.value;

  const isAuthenticated = Boolean(token || uid || demoId);
  const isAuthRoute = pathname.startsWith('/auth');
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/portfolio') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/transactions');

  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
