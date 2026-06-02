/**
 * Returns true if the url is safe for same-origin post-auth redirects.
 * Prevents open-redirect attacks where an attacker supplies an external URL.
 *
 * Rules:
 *   - Must start with "/" (relative path, same origin)
 *   - Must NOT start with "//" (protocol-relative external URL)
 */
export function isSafeRedirect(url: string | undefined | null): url is string {
  if (!url) return false;
  return url.startsWith("/") && !url.startsWith("//");
}

/**
 * Returns the url if safe, otherwise returns fallback (default "/dashboard").
 */
export function safeRedirect(
  url: string | undefined | null,
  fallback = "/dashboard"
): string {
  return isSafeRedirect(url) ? url : fallback;
}
