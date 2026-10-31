// lib/get-brands.ts
// Loads the brands that have products in ONE category:
//   GET /api/catalog/{segment}/brands   (docs/frontend-api.md, section 5)
// Note: it uses the WEBSITE segment ("cpu", "case"), not the API path.
//
// The answer is cached by apiGet, so calling this from several places on the
// same page (page, metadata, listing) costs only one request.

import { apiGet } from "@/lib/api";
import type { Category } from "@/lib/site";
import type { Brand, BrandList } from "@/lib/types";

/**
 * All brands of a category. Throws if the API fails, so the error.tsx screen
 * shows (a failed call must never look like "this brand does not exist").
 * A real category with no products gives an empty list.
 */
export async function getBrands(category: Category): Promise<Brand[]> {
  const result = await apiGet<BrandList>(`/catalog/${category.segment}/brands`);

  return result.data;
}
