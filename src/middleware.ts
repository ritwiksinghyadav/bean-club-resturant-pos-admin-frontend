import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const host = req.headers.get("host") || "";
  const pathname = nextUrl.pathname;

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isPublicRoute = pathname.startsWith("/auth");

  // Determine if it is the users subdomain
  const isUsersSubdomain = host.includes("users.localhost");

  if (isApiAuthRoute) {
    return;
  }

  // Rewrite for users subdomain (to serve the customer POS pages from /users prefix)
  if (isUsersSubdomain) {
    // If the path doesn't already start with /users, rewrite it!
    if (!pathname.startsWith("/users")) {
      const url = nextUrl.clone();
      url.pathname = `/users${pathname}`;
      return NextResponse.rewrite(url);
    }
    return; // Don't require admin authentication for users.localhost
  }

  // For anything starting with /users (e.g. if accessed directly as localhost:3000/users), do not require admin auth
  if (pathname.startsWith("/users")) {
    return;
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard/overview", nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/auth/sign-in", nextUrl));
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
