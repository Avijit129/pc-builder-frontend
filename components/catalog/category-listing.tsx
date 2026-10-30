import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ComponentCard } from "@/components/catalog/component-card";
import { ListToolbar } from "@/components/catalog/list-toolbar";
import { Pagination } from "@/components/catalog/pagination";
import { apiGet } from "@/lib/api";
import { LIST_FILTERS } from "@/lib/list-filters";
import {
  PER_PAGE,
  parseListParams,
  type ListParams,
  type RawSearchParams,
} from "@/lib/list-params";
import type { Category } from "@/lib/site";
import type { Brand, BrandList, ListItem, Paginated } from "@/lib/types";

type Props = {
  category: Category;
  searchParams: Promise<RawSearchParams>;
};

// The brands that have products in this category (GET /api/catalog/{segment}/brands).
// The answer is cached by apiGet. If this call fails we return null: the page
// still works, it only hides the brand field.
async function loadBrands(segment: string): Promise<Brand[] | null> {
  try {
    const result = await apiGet<BrandList>(`/catalog/${segment}/brands`);

    return result.data;
  } catch {
    return null;
  }
}

// Reading searchParams is "request data", so the page must wrap this
// component in <Suspense> (the page does that).
export async function CategoryListing({ category, searchParams }: Props) {
  const rawParams = parseListParams(await searchParams, category.type);

  const brands = await loadBrands(category.segment);

  // A brand that is not in the list (a typo in the URL) is ignored, the same
  // way as any other bad value. If the brand list could not be loaded, we
  // cannot check it, so we keep the value.
  const params: ListParams =
    brands !== null &&
    !brands.some((brand) => brand.slug === rawParams.manufacturer)
      ? { ...rawParams, manufacturer: "" }
      : rawParams;

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
      manufacturer: params.manufacturer,
      ...params.filters,
    },
  );

  const { total, current_page, last_page } = result.meta;

  return (
    <>
      <ListToolbar
        segment={category.segment}
        label={category.label}
        params={params}
        filters={LIST_FILTERS[category.type]}
        brands={brands}
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
            <Link href={`/${category.segment}`}>Show all {category.label}</Link>
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
        segment={category.segment}
        params={params}
        currentPage={current_page}
        lastPage={last_page}
      />
    </>
  );
}
