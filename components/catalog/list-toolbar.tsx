import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilterDef } from "@/lib/list-filters";
import {
  SORT_OPTIONS,
  hasActiveFilters,
  type ListParams,
} from "@/lib/list-params";
import type { Brand } from "@/lib/types";

type Props = {
  segment: string;
  label: string;
  params: ListParams;
  /** The extra filters of this list (from lib/list-filters.ts). */
  filters: FilterDef[];
  /** null means the brand list could not be loaded, so the field is hidden. */
  brands: Brand[] | null;
};

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const labelClass = "mb-1 block text-sm font-medium";

// One extra filter: a number box or a select, depending on its "kind".
function FilterField({ filter, value }: { filter: FilterDef; value: string }) {
  const id = `filter-${filter.key}`;

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {filter.label}
      </label>

      {filter.kind === "select" ? (
        <select
          id={id}
          name={filter.key}
          defaultValue={value}
          className={fieldClass}
        >
          <option value="">Any</option>
          {filter.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        // min and max make the browser stop a wrong number before it is sent.
        <input
          id={id}
          name={filter.key}
          type="number"
          inputMode="numeric"
          min={filter.min}
          max={filter.max}
          step={1}
          defaultValue={value}
          placeholder={filter.placeholder}
          className={fieldClass}
        />
      )}
    </div>
  );
}

export function ListToolbar({
  segment,
  label,
  params,
  filters,
  brands,
}: Props) {
  const showBrand = brands !== null && brands.length > 0;
  const showSecondRow = showBrand || filters.length > 0;

  return (
    // next/form turns the fields into URL parameters:
    //   /cpu?search=ryzen&sort=newest&manufacturer=amd
    // The "key" makes the form start fresh when the URL changes (for example
    // after "Clear"). It must include EVERY field, or a field keeps old text.
    <Form
      key={JSON.stringify([
        params.search,
        params.sort,
        params.manufacturer,
        params.filters,
      ])}
      action={`/${segment}`}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="search" className={labelClass}>
            Search {label}
          </label>
          <input
            id="search"
            name="search"
            type="search"
            maxLength={100}
            defaultValue={params.search}
            placeholder="Search by name"
            className={fieldClass}
          />
        </div>

        <div className="sm:w-52">
          <label htmlFor="sort" className={labelClass}>
            Sort by
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={params.sort}
            className={fieldClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showSecondRow && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {showBrand && (
            <div>
              <label htmlFor="manufacturer" className={labelClass}>
                Brand
              </label>
              <select
                id="manufacturer"
                name="manufacturer"
                defaultValue={params.manufacturer}
                className={fieldClass}
              >
                <option value="">All brands</option>
                {brands.map((brand) => (
                  <option key={brand.slug} value={brand.slug}>
                    {brand.name} ({brand.products_count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {filters.map((filter) => (
            <FilterField
              key={filter.key}
              filter={filter}
              value={params.filters[filter.key] ?? ""}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit">
          <Search />
          Search
        </Button>
        {hasActiveFilters(params) && (
          <Button asChild variant="outline">
            <Link href={`/${segment}`}>Clear</Link>
          </Button>
        )}
      </div>
    </Form>
  );
}
