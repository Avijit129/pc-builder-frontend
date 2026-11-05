// lib/get-price-history.ts
// Loads the price history of ONE part:
//   GET /api/cpus/{slug}/price-history?days=90   (docs/frontend-api.md, section 4b)
// The same path works for the other 7 types: category.apiPath + /{slug}/price-history.
//
// The answer is cached by apiGet. The endpoint is limited to 120 requests per
// minute per IP, and our server calls it from one IP, so the cache matters.

import { ApiError, apiGet } from "@/lib/api";
import { isValidSlug } from "@/lib/get-component";
import type { Category } from "@/lib/site";
import type { ApiData, PriceHistory } from "@/lib/types";

/** How many days the chart shows. Laravel allows 7 to 365. */
export const HISTORY_DAYS = 90;

/**
 * Returns the history, or null when it could not be loaded.
 *
 * It never throws. The chart is a bonus: if Laravel is slow or answers with an
 * error (404, 422, 429, 500 ...), the rest of the part page must still work.
 * The section shows a short message when this returns null.
 */
export async function getPriceHistory(
  category: Category,
  slug: string,
  days: number = HISTORY_DAYS,
): Promise<PriceHistory | null> {
  if (!isValidSlug(slug)) return null;

  try {
    const result = await apiGet<ApiData<PriceHistory>>(
      `${category.apiPath}/${slug}/price-history`,
      { days },
    );

    return result.data;
  } catch (error) {
    // A 404 is not worth a log line: the page itself would be a 404 too.
    if (!(error instanceof ApiError && error.status === 404)) {
      console.error(`Price history of ${slug} could not be loaded:`, error);
    }

    return null;
  }
}
