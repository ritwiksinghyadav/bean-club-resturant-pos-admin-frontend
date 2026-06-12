export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payloadBase64 = parts[1];
    // Base64Url to Base64
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = JSON.parse(window.atob(base64));

    // Check if token expires within 1 minute (60s)
    return Date.now() >= decodedPayload.exp * 1000 - 60 * 1000;
  } catch {
    return true;
  }
}
