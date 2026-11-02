// lib/get-my-build.ts
// Loads ONE of my builds: GET /api/my/builds/{slug} (docs/frontend-api.md,
// section 9). It also works for a private build. Another user's slug gives 404.
//
// This call needs the login token, so it is NOT cached (it uses serverRequest,
// not apiGet). Call it only from a Server Component inside <Suspense>,
// because reading the cookie is request data.

import { serverRequest } from "@/lib/api-server";
import { isValidSlug } from "@/lib/get-component";
import { getSessionToken } from "@/lib/session";
import type { ApiData, BuildPage } from "@/lib/types";

export type MyBuildResult =
  | { status: "ok"; build: BuildPage }
  // No cookie, or the token is old or deleted (401).
  | { status: "needs_login" }
  // An unknown slug, a strange slug, or the build of another user.
  | { status: "not_found" };

export async function getMyBuild(slug: string): Promise<MyBuildResult> {
  // The slug goes into the URL, so it must look like a slug.
  if (!isValidSlug(slug)) return { status: "not_found" };

  const token = await getSessionToken();

  if (token === null) return { status: "needs_login" };

  const response = await serverRequest<ApiData<BuildPage>>(
    "GET",
    `/my/builds/${slug}`,
    { token },
  );

  if (response.ok) return { status: "ok", build: response.data.data };

  if (response.status === 401) return { status: "needs_login" };
  if (response.status === 404) return { status: "not_found" };

  // Laravel is down, 429, 500 ... The error.tsx file shows it.
  throw new Error(response.message);
}
