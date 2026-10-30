import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_SORT, SORT_OPTIONS, type ListParams } from "@/lib/list-params";

type Props = {
  segment: string;
  label: string;
  params: ListParams;
};

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ListToolbar({ segment, label, params }: Props) {
  const hasFilters = params.search !== "" || params.sort !== DEFAULT_SORT;

  return (
    // next/form turns the fields into URL parameters: /cpu?search=ryzen&sort=newest
    // The "key" makes the form start fresh when the URL changes (for example after "Clear").
    <Form
      key={`${params.search}|${params.sort}`}
      action={`/${segment}`}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="search" className="mb-1 block text-sm font-medium">
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
        <label htmlFor="sort" className="mb-1 block text-sm font-medium">
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

      <div className="flex gap-2">
        <Button type="submit">
          <Search />
          Search
        </Button>
        {hasFilters && (
          <Button asChild variant="outline">
            <Link href={`/${segment}`}>Clear</Link>
          </Button>
        )}
      </div>
    </Form>
  );
}
