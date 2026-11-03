"use client";

// components/compare/add-part.tsx
// The "Add a part" box of the compare page. It opens the same part picker as
// the PC Builder. When you choose a part, we go to the same page with that
// part added to the URL (?items=...), and the server draws the new table.
//
// It gets "segment" (a string) and not the whole category: the category has an
// icon function inside, and a function cannot go from a Server Component to a
// Client Component.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartPicker } from "@/components/builder/part-picker";
import { MAX_COMPARE, compareHref } from "@/lib/compare-url";
import { getCategoryBySegment } from "@/lib/site";

type Props = {
  segment: string;
  /** The slugs that are on the page now. */
  slugs: string[];
  /** The ids of the same parts. The picker marks them as "Chosen". */
  ids: number[];
  /** Open at the start. The page does this when nothing is chosen yet. */
  startOpen?: boolean;
  /** Kept in the new address, so the "differences only" switch stays on. */
  diffOnly?: boolean;
};

export function AddPart({
  segment,
  slugs,
  ids,
  startOpen = false,
  diffOnly = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const category = getCategoryBySegment(segment);

  if (!category) return null;

  if (slugs.length >= MAX_COMPARE) {
    return (
      <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        You can compare up to {MAX_COMPARE} parts. Remove one to add another.
      </p>
    );
  }

  return (
    <section
      aria-labelledby="add-part-heading"
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="add-part-heading" className="font-medium">
            Add a part
          </h2>
          <p className="text-sm text-muted-foreground">
            {slugs.length} of {MAX_COMPARE} chosen
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant={open ? "outline" : "default"}
          aria-expanded={open}
          aria-controls="add-part-picker"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Plus />}
          {open ? "Close" : "Add a part"}
        </Button>
      </div>

      {/* The picker only exists while open, so it starts fresh every time. */}
      {open && (
        <div id="add-part-picker" className="mt-4">
          <PartPicker
            category={category}
            repeatable={false}
            selectedIds={ids}
            onPick={(item) => {
              setOpen(false);
              router.push(
                compareHref(segment, [...slugs, item.slug], { diffOnly }),
              );
            }}
          />
        </div>
      )}
    </section>
  );
}
