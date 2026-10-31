import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLinks } from "@/components/catalog/brand-links";
import { ComponentCard } from "@/components/catalog/component-card";
import { ListToolbar } from "@/components/catalog/list-toolbar";
import { Pagination } from "@/components/catalog/pagination";
import { apiGet } from "@/lib/api";
import { getBrands } from "@/lib/get-brands";
import { LIST_FILTERS } from "@/lib/list-filters";
import {
  PER_PAGE,
  parseListParams,
  type ListParams,
  type RawSearchParams,
} from "@/lib/list-params";
import type { Category } from "@/lib/site";
import type { Brand, ListItem, Paginated } from "@/lib/types";

type Props = {
  category: Category;
  searchParams: Promise<RawSearchParams>;
  /**
   * Set on a brand page (/cpu/amd). The list then only shows this brand, the
   * brand select is hidden, and links stay on the brand page.
   */
  brand?: Brand;
};

// The brands that have products in this category (see lib/get-brands.ts).
// If this call fails we return null: the page still works, it only hides the
// brand select and the brand links.
async function loadBrands(category: Category): Promise<Brand[] | null> {
  try {
    return await getBrands(category);
  } catch {
    return null;
  }
}

// Reading searchParams is "request data", so the page must wrap this
// component in <Suspense> (the page does that).
export async function CategoryListing({
  category,
  searchParams,
  brand,
}: Props) {
  const rawParams = parseListParams(await searchParams, category.type);

  const brands = await loadBrands(category);

  // The address of this list without the "?...":
  //   /cpu on a category page, /cpu/amd on a brand page.
  // ListToolbar and Pagination call this "segment". It is the path without
  // the first "/", so they work for both kinds of page without changes.
  const basePath = brand
    ? `${category.segment}/${brand.slug}`
    : category.segment;

  // Keep ?manufacturer= only on a category page, and only when it is a real
  // brand. On a brand page the brand is in the path, so it must not also be in
  // the query string. A typo in the URL is ignored like any other bad value.
  // If the brand list could not be loaded we cannot check it, so we keep it.
  const keepBrandFilter =
    brand === undefined &&
    (brands === null ||
      brands.some((item) => item.slug === rawParams.manufacturer));

  const params: ListParams = keepBrandFilter
    ? rawParams
    : { ...rawParams, manufacturer: "" };

  // If Laravel is down or answers with an error, this throws and the
  // error.tsx file next to the page shows the error screen.
  const result = await apiGet<Paginated<ListItem<Record<string, unknown>>>>(
    category.apiPath,
    {
      search: params.search,
      sort: params.sort,
      page: params.page,
      per_page: PER_PAGE,
      // Empty values are skipped by apiGet.
      manufacturer: brand ? brand.slug : params.manufacturer,
      ...params.filters,
    },
  );

  const { total, current_page, last_page } = result.meta;

  return (
    <>
      <ListToolbar
        segment={basePath}
        label={category.label}
        params={params}
        filters={LIST_FILTERS[category.type]}
        // On a brand page there is no brand select (the brand is fixed).
        brands={brand ? null : brands}
      />

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "result" : "results"}
      </p>

      {result.data.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No {category.label} found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search, or clear the filters.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/${basePath}`}>
              Show all{" "}
              {brand ? `${brand.name} ${category.label}` : category.label}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.data.map((item) => (
            <li key={item.id}>
              <ComponentCard category={category} item={item} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        segment={basePath}
        params={params}
        currentPage={current_page}
        lastPage={last_page}
      />

      {brands !== null && (
        <BrandLinks
          category={category}
          brands={brands}
          currentSlug={brand?.slug}
        />
      )}
    </>
  );
}
