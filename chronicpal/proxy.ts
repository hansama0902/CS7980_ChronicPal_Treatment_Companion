import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export const proxy = auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;
  const role = session?.user?.role;

  if (pathname.startsWith('/caregiver')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    if (role !== 'CAREGIVER') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    if (role === 'CAREGIVER') {
      return NextResponse.redirect(new URL('/caregiver/dashboard', req.nextUrl));
    }
  }
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/caregiver/:path*',
    '/labs/:path*',
    '/treatments/:path*',
    '/symptoms/:path*',
  ],
};
