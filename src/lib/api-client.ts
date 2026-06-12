import { useCartStore } from '@/app/users/cart-store';
import { getSession, signOut } from 'next-auth/react';

const getApiUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Helper to clone/append Bearer authorization headers
 */
function appendAuthHeader(
  headers: HeadersInit | undefined,
  token: string
): Headers {
  const newHeaders = new Headers(headers || {});
  newHeaders.set('Authorization', `Bearer ${token}`);
  return newHeaders;
}

/**
 * Customer / User Portal Fetch Wrapper
 */
export async function fetchWithUserAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const store = useCartStore.getState();
  const token = store.token;

  const headers = appendAuthHeader(options.headers, token || '');
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && store.refreshToken) {
    try {
      const refreshRes = await fetch(`${getApiUrl()}/users/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: store.refreshToken })
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.result) {
          const {
            accessToken,
            refreshToken: newRefreshToken,
            user
          } = refreshData.result;
          store.setAuth(
            accessToken,
            newRefreshToken || store.refreshToken,
            user
          );

          const retryHeaders = appendAuthHeader(options.headers, accessToken);
          response = await fetch(url, { ...options, headers: retryHeaders });
        }
      } else {
        store.logout();
      }
    } catch (err) {
      console.error('User token auto-refresh failed:', err);
      store.logout();
    }
  }

  return response;
}

// Alias for backwards compatibility
export const fetchWithAuth = fetchWithUserAuth;

/**
 * Admin / POS Dashboard Fetch Wrapper (NextAuth integrated)
 */
export async function fetchWithAdminAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getSession();
  const token = (session?.user as any)?.accessToken;

  // Sign out immediately if we got a refresh error
  if ((session?.user as any)?.error === 'RefreshAccessTokenError') {
    signOut({ callbackUrl: '/auth/sign-in' });
    return new Response(
      JSON.stringify({ success: false, message: 'Session expired' }),
      { status: 401 }
    );
  }

  const headers = token
    ? appendAuthHeader(options.headers, token)
    : new Headers(options.headers);
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    try {
      // Force getSession() call which contacts next-auth to trigger server rotation
      const newSession = await getSession();
      const newToken = (newSession?.user as any)?.accessToken;

      if ((newSession?.user as any)?.error === 'RefreshAccessTokenError') {
        signOut({ callbackUrl: '/auth/sign-in' });
        return response;
      }

      if (newToken && newToken !== token) {
        const retryHeaders = appendAuthHeader(options.headers, newToken);
        response = await fetch(url, { ...options, headers: retryHeaders });
      }
    } catch (err) {
      console.error('Admin token auto-refresh failed:', err);
    }
  }

  return response;
}
