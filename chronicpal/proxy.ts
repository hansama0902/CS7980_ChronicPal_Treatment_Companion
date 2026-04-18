export { auth as proxy } from '@/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/labs/:path*', '/treatments/:path*', '/symptoms/:path*'],
};
