"use client";

// components/compare/compare-toggle.tsx
// The "Add to compare" button at the bottom of a card on a list page.
// The text changes with the state, so we do not need aria-pressed.

import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_COMPARE } from "@/lib/compare-url";
import { useCompareTray } from "@/lib/use-compare-tray";

type Props = {
  /** The website part, for example "cpu". */
  segment: string;
  slug: string;
  /** The name of the part. Only screen readers read it. */
  name: string;
};

export function CompareToggle({ segment, slug, name }: Props) {
  const { slugs, isFull, toggle } = useCompareTray(segment);

  const selected = slugs.includes(slug);
  // When 4 parts are chosen, only the chosen ones stay active (to remove them).
  const blocked = !selected && isFull;

  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "outline"}
      className="w-full"
      disabled={blocked}
      onClick={() => toggle(slug)}
    >
      {selected ? <Check /> : <Plus />}
      {selected
        ? "Added to compare"
        : blocked
          ? `Compare is full (${MAX_COMPARE})`
          : "Add to compare"}
      {/* A page has many of these buttons, so each one needs its own name. */}
      <span className="sr-only"> ({name})</span>
    </Button>
  );
}
