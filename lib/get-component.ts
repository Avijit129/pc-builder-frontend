// lib/get-component.ts
// Loads ONE component page from Laravel: GET /api/cpus/{slug} (same for the
// other 7 types). The API uses the slug, never the id (docs/frontend-api.md,
// section 4).

import { ApiError, apiGet } from "@/lib/api";
import { isValidSlug } from "@/lib/slug";
import type { Category } from "@/lib/site";
import type { ApiData, ComponentDetail } from "@/lib/types";

// The rule now lives in lib/slug.ts. Five server files still import
// isValidSlug from here, so we pass it on. They keep working unchanged.
export { isValidSlug };

/**
 * Returns the component, or null when it does not exist (Laravel answers 404
 * for an unknown slug and for an inactive part). Any other error is thrown,
 * so the error.tsx screen shows it.
 */
export async function getComponent(
  category: Category,
  slug: string,
): Promise<ComponentDetail | null> {
  if (!isValidSlug(slug)) return null;

  try {
    const result = await apiGet<ApiData<ComponentDetail>>(
      `${category.apiPath}/${slug}`,
    );

    return result.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;

    throw error;
  }
}
