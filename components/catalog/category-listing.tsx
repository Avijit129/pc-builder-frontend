import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ComponentCard } from "@/components/catalog/component-card";
import { ListToolbar } from "@/components/catalog/list-toolbar";
import { Pagination } from "@/components/catalog/pagination";
import { apiGet } from "@/lib/api";
import {
  PER_PAGE,
  parseListParams,
  type RawSearchParams,
} from "@/lib/list-params";
import type { Category } from "@/lib/site";
import type { ListItem, Paginated } from "@/lib/types";

type Props = {
  category: Category;
  searchParams: Promise<RawSearchParams>;
};

// Reading searchParams is "request data", so the page must wrap this
// component in <Suspense> (the page does that).
export async function CategoryListing({ category, searchParams }: Props) {
  const params = parseListParams(await searchParams);

  // If Laravel is down or answers with an error, this throws and the
  // error.tsx file next to the page shows the error screen.
  const result = await apiGet<Paginated<ListItem<Record<string, unknown>>>>(
    category.apiPath,
    {
      search: params.search,
      sort: params.sort,
      page: params.page,
      per_page: PER_PAGE,
    },
  );

  const { total, current_page, last_page } = result.meta;

  return (
    <>
      <ListToolbar
        segment={category.segment}
        label={category.label}
        params={params}
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
