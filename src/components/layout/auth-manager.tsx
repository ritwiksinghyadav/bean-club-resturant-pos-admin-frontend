'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';

// Keep reference to the original fetch to prevent loop recursion and restore it on unmount
const originalFetch = typeof window !== 'undefined' ? window.fetch : null;

export default function AuthManager() {
  const { data: session, update } = useSession();
  const updatingRef = useRef(false);

  // Watch for session refresh errors and sign out
  useEffect(() => {
    if ((session?.user as any)?.error === 'RefreshAccessTokenError') {
      signOut({ callbackUrl: '/auth/sign-in' });
    }
  }, [session]);

  // Intercept window.fetch to automatically handle 401s for admin dashboard APIs
  useEffect(() => {
    if (typeof window === 'undefined' || !originalFetch) return;

    const interceptedFetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      let response = await originalFetch(input, init);

      const urlString =
        input instanceof URL
          ? input.toString()
          : typeof input === 'string'
            ? input
            : (input as Request).url;

      // We only intercept admin API routes (exclude NextAuth auth routes)
      const isApiCall = urlString.includes('/admin/');

      if (response.status === 401 && isApiCall && !updatingRef.current) {
        updatingRef.current = true;
        try {
          // Force NextAuth to rotate the token on the server
          const newSession = await update({ forceRefresh: true });
          const newToken = (newSession?.user as any)?.accessToken;

          // Check if session refresh failed
          if ((newSession?.user as any)?.error === 'RefreshAccessTokenError') {
            signOut({ callbackUrl: '/auth/sign-in' });
            return response;
          }

          if (newToken) {
            const newInit = { ...init };

            // Re-build headers with the new token
            if (newInit.headers instanceof Headers) {
              newInit.headers.set('Authorization', `Bearer ${newToken}`);
            } else if (Array.isArray(newInit.headers)) {
              const filtered = newInit.headers.filter(
                ([k]) => k.toLowerCase() !== 'authorization'
              );
              newInit.headers = [
                ...filtered,
                ['Authorization', `Bearer ${newToken}`]
              ];
            } else {
              newInit.headers = {
                ...newInit.headers,
                Authorization: `Bearer ${newToken}`
              };
            }

            // Retry original request
            response = await originalFetch(input, newInit);
          }
        } catch (error) {
          console.error('Fetch interceptor auto-refresh failed:', error);
        } finally {
          updatingRef.current = false;
        }
      }

      return response;
    };

    window.fetch = interceptedFetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, [update]);

  return null;
}
