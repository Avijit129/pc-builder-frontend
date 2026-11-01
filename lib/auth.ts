// lib/auth.ts
// Who is logged in? Use this in Server Components, always inside <Suspense>
// (reading a cookie is request data, see the cacheComponents note).

import { cache } from "react";
import { serverRequest } from "@/lib/api-server";
import { getSessionToken } from "@/lib/session";
import type { ApiData, User } from "@/lib/types";

/**
 * The logged-in user, or null.
 *
 * null also means: the token is expired or deleted (401), or Laravel could not
 * answer. Then the site simply looks logged out, instead of crashing every
 * page. The old cookie stays until the next login or logout replaces it. A
 * Server Component is not allowed to delete a cookie.
 *
 * cache() from React remembers the answer for ONE request. The header and a
 * page can both call this, and Laravel is asked only once.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getSessionToken();

  if (token === null) return null;

  const response = await serverRequest<ApiData<User>>("GET", "/auth/me", {
    token,
  });

  if (response.ok) return response.data.data;

  // 401 is normal (an old token). Anything else is worth a line in the log.
  if (response.status !== 401) {
    console.error(`GET /auth/me failed with status ${response.status}`);
  }

  return null;
});
