// lib/safe-redirect.ts
// "?next=/builder" tells the login page where to go afterwards. The value
// comes from the URL, so anyone can write anything there. This function lets
// only a path on OUR site through. Without it, a link like
// /login?next=//evil.com would send a freshly logged-in user to another site.

/** Pages we never send the user back to (it would be a loop). */
const AUTH_PATH = /^\/(login|register)(\/|\?|#|$)/;

export function safeNextPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (typeof value !== "string") return fallback;

  const path = value.trim();

  // It must start with exactly ONE slash. "//evil.com" is another site, and
  // some browsers also treat "/\evil.com" that way.
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return fallback;
  }

  // No control characters (line breaks and so on).
  if (/[\u0000-\u001F\u007F]/.test(path)) return fallback;

  if (AUTH_PATH.test(path)) return fallback;

  return path;
}
