// lib/list-params.ts
// The list pages keep their state in the URL:
//   /cpu?search=ryzen&sort=price_low&manufacturer=amd&page=2
// This file reads those values and cleans them. Laravel answers 422 for bad
// values (see docs/frontend-api.md, section 3), so we never send raw input.
// A bad value is dropped (treated as "not set"), the page still works.

import { LIST_FILTERS, type FilterDef } from "@/lib/list-filters";
import type { ComponentType } from "@/lib/types";

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
  /** Brand slug, for example "amd". "" means all brands. */
  manufacturer: string;
  /** The extra filters of this list. Only valid values. Key = URL name. */
  filters: Record<string, string>;
};

/** What Next.js gives us as searchParams. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

// ?search=a&search=b gives an array. We only use the first value.
function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// A brand slug is letters, numbers, dash and underscore (for example "msi").
// Laravel allows at most 100 characters.
function cleanManufacturer(value: string): string {
  const slug = value.trim();

  return /^[A-Za-z0-9_-]{1,100}$/.test(slug) ? slug : "";
}

// Returns "" when the value is not valid for this filter.
function cleanFilterValue(filter: FilterDef, rawValue: string): string {
  const value = rawValue.trim();

  if (value === "") return "";

  if (filter.kind === "select") {
    // Only values from our list. Laravel compares them exactly.
    return filter.options.includes(value) ? value : "";
  }

  const number = Number(value);

  return Number.isInteger(number) &&
    number >= filter.min &&
    number <= filter.max
    ? String(number)
    : "";
}

/** "type" decides which extra filters are read (see lib/list-filters.ts). */
export function parseListParams(
  raw: RawSearchParams,
  type: ComponentType,
): ListParams {
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

  const manufacturer = cleanManufacturer(first(raw.manufacturer));

  const filters: Record<string, string> = {};

  for (const filter of LIST_FILTERS[type]) {
    const value = cleanFilterValue(filter, first(raw[filter.key]));

    if (value !== "") filters[filter.key] = value;
  }

  return { search, sort, page, manufacturer, filters };
}

/** True when anything narrows or changes the list. Used for the Clear button. */
export function hasActiveFilters(params: ListParams): boolean {
  return (
    params.search !== "" ||
    params.sort !== DEFAULT_SORT ||
    params.manufacturer !== "" ||
    Object.keys(params.filters).length > 0
  );
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
  if (params.manufacturer) query.set("manufacturer", params.manufacturer);

  for (const [key, value] of Object.entries(params.filters)) {
    query.set(key, value);
  }

  if (page > 1) query.set("page", String(page));

  const queryString = query.toString();

  return queryString ? `/${segment}?${queryString}` : `/${segment}`;
}
