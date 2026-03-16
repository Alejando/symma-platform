/**
 * Checks if a JWT token is expired by decoding its payload and comparing exp claim.
 * @param token - The JWT token string
 * @returns true if the token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (typeof payload.exp !== 'number') {
      return true;
    }
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
