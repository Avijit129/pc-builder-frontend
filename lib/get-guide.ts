// lib/get-guide.ts
// Loads ONE guide from Laravel: GET /api/guides/{slug} (docs/frontend-api.md,
// section 5b). A draft, a scheduled guide and an unknown slug give the same
// 404 from Laravel, so all of them return null here.
//
// The answer is cached by apiGet. generateMetadata AND the page call this, and
// it still costs only one request.

import { ApiError, apiGet } from "@/lib/api";
import { isValidSlug } from "@/lib/slug";
import type { ApiData, GuidePage } from "@/lib/types";

/**
 * Returns the guide, or null when it does not exist or is not published.
 * Any other error (Laravel down, 429, 500) is thrown, so error.tsx shows it.
 */
export async function getGuide(slug: string): Promise<GuidePage | null> {
  // The slug goes into the URL, so it must look like a slug.
  if (!isValidSlug(slug)) return null;

  try {
    const result = await apiGet<ApiData<GuidePage>>(`/guides/${slug}`);

    return result.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;

    throw error;
  }
}
