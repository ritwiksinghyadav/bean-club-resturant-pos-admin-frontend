import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { isRouteAllowed, AdminRole } from '@/lib/rbac';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const host = req.headers.get('host') || '';
  const pathname = nextUrl.pathname;

  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isPublicRoute = pathname.startsWith('/auth');

  // Determine the application mode from environment variables
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || process.env.APP_MODE;

  // Determine if it is the users/customer POS flow
  let isUsersSubdomain = false;
  if (appMode === 'user') {
    isUsersSubdomain = true;
  } else if (appMode === 'admin') {
    isUsersSubdomain = false;
  } else {
    // Fallback to subdomain logic if no explicit environment mode is set
    isUsersSubdomain =
      host.startsWith('users.') || host.includes('users.localhost');
  }

  if (isApiAuthRoute) {
    return;
  }

  // Rewrite for users subdomain (to serve the customer POS pages from /users prefix)
  if (isUsersSubdomain) {
    // If the path doesn't already start with /users, rewrite it!
    if (!pathname.startsWith('/users')) {
      const url = nextUrl.clone();
      url.pathname = `/users${pathname}`;
      return NextResponse.rewrite(url);
    }
    return; // Don't require admin authentication for users.localhost
  }

  // For anything starting with /users (e.g. if accessed directly as localhost:3000/users), do not require admin auth
  if (pathname.startsWith('/users')) {
    return;
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/dashboard/overview', nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL('/auth/sign-in', nextUrl));
  }

  // Role-based route guard for admin panel
  if (pathname.startsWith('/dashboard')) {
    const role = (req.auth?.user as any)?.role as AdminRole | undefined;
    if (role && !isRouteAllowed(role, pathname)) {
      const fallbackUrl =
        role === 'kitchen' ? '/dashboard/orders' : '/dashboard/overview';
      return Response.redirect(new URL(fallbackUrl, nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
