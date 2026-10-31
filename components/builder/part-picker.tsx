"use client";

// components/builder/part-picker.tsx
// The list of parts you can choose from, with a search box and Previous/Next.
// It loads the list from Laravel in the browser (GET /api/cpus?search=...).
//
// How the loading works:
// - "input" is what the user types. After 300 ms of silence it is copied to
//   "search", and the list is loaded for "search".
// - Every answer is saved together with its "key" (search + page + retry).
//   If the saved key is not the current key, the list is still loading.
//   That way we never call setState directly inside an effect.

import { useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartThumb } from "@/components/builder/part-thumb";
import { ClientApiError, clientGet } from "@/lib/api-client";
import type { PartItem } from "@/lib/builder";
import { formatPrice, formatSpecValue } from "@/lib/format";
import { LIST_SPECS } from "@/lib/list-specs";
import type { Category } from "@/lib/site";
import type { Paginated } from "@/lib/types";
import { cn } from "@/lib/utils";

const PER_PAGE = 8;
/** How many specs are written under the name of a part. */
const SPECS_SHOWN = 4;
const DEBOUNCE_MS = 300;

type Props = {
  category: Category;
  /** true for RAM and SSD: the button says "Add" and can be used again. */
  repeatable: boolean;
  /** Ids of the parts of this type that are already in the build. */
  selectedIds: number[];
  onPick: (item: PartItem) => void;
};

type Answer = {
  key: string;
  data?: Paginated<PartItem>;
  error?: string;
};

export function PartPicker({
  category,
  repeatable,
  selectedIds,
  onPick,
}: Props) {
  const searchId = useId();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState({ query: "", page: 1 });
  // Goes up by 1 when the user presses "Try again".
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);

  const key = `${search.query}|${search.page}|${attempt}`;

  // 1. Wait until the user stops typing, then start a new search on page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = input.trim();

      setSearch((current) =>
        current.query === query ? current : { query, page: 1 },
      );
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [input]);

  // 2. Load the list. The cleanup cancels the old call when a new one starts.
  useEffect(() => {
    const controller = new AbortController();

    clientGet<Paginated<PartItem>>(
      category.apiPath,
      { search: search.query, page: search.page, per_page: PER_PAGE },
      controller.signal,
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setAnswer({ key, data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        if (error instanceof ClientApiError) {
          setAnswer({ key, error: error.message });
          return;
        }

        console.error(error);
        setAnswer({ key, error: "Something went wrong. Please try again." });
      });

    return () => controller.abort();
  }, [category.apiPath, search.query, search.page, key]);

  // The answer is "current" only when it belongs to the current key.
  const current = answer !== null && answer.key === key ? answer : null;
  const loading = current === null;
  const error = current?.error;
  // While a new list loads, we keep showing the old one (faded).
  const data = answer?.data;

  let status = "Loading…";

  if (error) {
    status = "Could not load the list.";
  } else if (current && data) {
    status = `${data.meta.total} ${data.meta.total === 1 ? "result" : "results"}`;
  }

  return (
    <div>
      <label htmlFor={searchId} className="sr-only">
        Search {category.label}
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={searchId}
          type="search"
          maxLength={100}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`Search ${category.label} by name`}
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* role="status" is read by screen readers when the text changes. */}
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {status}
      </p>

      {error ? (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-destructive/40 p-4 text-sm"
        >
          <p>{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => setAttempt((count) => count + 1)}
          >
            Try again
          </Button>
        </div>
      ) : data === undefined ? (
        <PickerSkeleton />
      ) : data.data.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No {category.label} found. Try a different search.
        </p>
      ) : (
        <ul
          aria-busy={loading}
          className={cn(
            "mt-3 divide-y rounded-lg border",
            loading && "opacity-60",
          )}
        >
          {data.data.map((item) => {
            const isSelected = !repeatable && selectedIds.includes(item.id);
            const price = formatPrice(item.lowest_price);

            // For example "Socket: AM5 · Cores: 8 · Threads: 16 · Boost clock: 5 GHz"
            const summary = LIST_SPECS[category.type]
              .slice(0, SPECS_SHOWN)
              .map(
                (field) =>
                  `${field.label}: ${formatSpecValue(item.specs[field.key], field)}`,
              )
              .join(" · ");

            return (
              <li key={item.id} className="flex items-center gap-3 p-3">
                <PartThumb category={category} item={item} />

                <div className="min-w-0 flex-1">
                  {item.manufacturer && (
                    <p className="text-xs text-muted-foreground">
                      {item.manufacturer.name}
                    </p>
                  )}
                  <p className="font-medium leading-snug">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {summary}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <p className="text-sm font-semibold">
                    {price ?? (
                      <span className="font-normal text-muted-foreground">
                        No in-stock price
                      </span>
                    )}
                  </p>

                  <Button
                    type="button"
                    size="sm"
                    variant={isSelected ? "outline" : "default"}
                    disabled={isSelected}
                    aria-label={
                      isSelected
                        ? `${item.name} is already chosen`
                        : `${repeatable ? "Add" : "Choose"} ${item.name}`
                    }
                    onClick={() => onPick(item)}
                  >
                    {isSelected ? "Chosen" : repeatable ? "Add" : "Choose"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {data && data.meta.last_page > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading || data.meta.current_page <= 1}
            onClick={() =>
              setSearch((value) => ({ ...value, page: value.page - 1 }))
            }
          >
            <ChevronLeft />
            Previous
          </Button>

          <p className="text-sm text-muted-foreground">
            Page {data.meta.current_page} of {data.meta.last_page}
          </p>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading || data.meta.current_page >= data.meta.last_page}
            onClick={() =>
              setSearch((value) => ({ ...value, page: value.page + 1 }))
            }
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

// Grey pulsing rows while the first list loads.
function PickerSkeleton() {
  return (
    <div className="mt-3 space-y-2" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-[4.5rem] animate-pulse rounded-lg border bg-muted/50"
        />
      ))}
    </div>
  );
}
