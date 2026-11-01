// lib/get-build.ts
// Loads ONE public shared build from Laravel: GET /api/builds/{slug}
// (docs/frontend-api.md, section 7).
//
// A private build and an unknown slug give the same 404 from Laravel, so both
// return null here. The answer is cached by apiGet. This matters because the
// endpoint is limited to 120 requests per minute per IP, and our server calls
// it from one IP. Calling this from generateMetadata AND from the page costs
// only one request.

import { ApiError, apiGet } from "@/lib/api";
import { isValidSlug } from "@/lib/get-component";
import type { ApiData, BuildPage } from "@/lib/types";

/**
 * Returns the build, or null when it does not exist or is private.
 * Any other error (Laravel down, 429, 500) is thrown, so error.tsx shows it.
 */
export async function getBuild(slug: string): Promise<BuildPage | null> {
  // Build slugs are lowercase letters, numbers and dashes. This check also
  // stops odd values like ".." from changing the API address.
  if (!isValidSlug(slug)) return null;

  try {
    const result = await apiGet<ApiData<BuildPage>>(`/builds/${slug}`);

    return result.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;

    throw error;
  }
}
