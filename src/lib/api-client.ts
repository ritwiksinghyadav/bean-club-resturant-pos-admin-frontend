import { useCartStore } from "@/app/users/cart-store";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/**
 * A customized fetch wrapper that appends the client authorization header 
 * and automatically intercepts 401 Unauthorized errors to rotate the 
 * customer's JWT access token using the persisted refresh token.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const store = useCartStore.getState();
  const token = store.token;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Execute request
  let response = await fetch(url, { ...options, headers });

  // Handle unauthorized response by attempting a token refresh
  if (response.status === 401 && store.refreshToken) {
    try {
      const refreshRes = await fetch(`${getApiUrl()}/users/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: store.refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.result) {
          const { accessToken, refreshToken: newRefreshToken, user } = refreshData.result;

          // Update Zustand store credentials
          store.setAuth(accessToken, newRefreshToken || store.refreshToken, user);

          // Retry the original request with the new access token
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set("Authorization", `Bearer ${accessToken}`);
          response = await fetch(url, { ...options, headers: retryHeaders });
        }
      } else {
        // Refresh token itself is invalid/expired
        store.logout();
      }
    } catch (err) {
      console.error("Token auto-refresh failed:", err);
      store.logout();
    }
  }

  return response;
}
