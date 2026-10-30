// lib/list-params.ts
// The list pages keep their state in the URL: /cpu?search=ryzen&sort=price_low&page=2
// This file reads those values and cleans them. Laravel answers 422 for bad
// values (see docs/frontend-api.md, section 3), so we never send raw input.

export const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortKey = "name";

/** Items per page. The API allows 1 to 50. */
export const PER_PAGE = 12;

export type ListParams = {
  search: string;
  sort: SortKey;
  page: number;
};

/** What Next.js gives us as searchParams. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

// ?search=a&search=b gives an array. We only use the first value.
function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseListParams(raw: RawSearchParams): ListParams {
  // The API allows at most 100 characters.
  const search = first(raw.search).trim().slice(0, 100);

  const sortValue = first(raw.sort);
  const sort =
    SORT_OPTIONS.find((option) => option.value === sortValue)?.value ??
    DEFAULT_SORT;

  const pageNumber = Number.parseInt(first(raw.page), 10);
  const page =
    Number.isInteger(pageNumber) && pageNumber >= 1
      ? Math.min(pageNumber, 10000)
      : 1;

  return { search, sort, page };
}

/** Build a clean list URL. Default values are left out of the URL. */
export function listHref(
  segment: string,
  params: ListParams,
  page: number = params.page,
): string {
  const query = new URLSearchParams();

  if (params.search) query.set("search", params.search);
  if (params.sort !== DEFAULT_SORT) query.set("sort", params.sort);
  if (page > 1) query.set("page", String(page));

  const queryString = query.toString();

  return queryString ? `/${segment}?${queryString}` : `/${segment}`;
}
