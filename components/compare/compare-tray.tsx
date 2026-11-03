"use client";

// components/compare/compare-tray.tsx
// The bar at the bottom of a list page: how many parts are chosen, a link to
// the compare page, and a Clear button. It is hidden while nothing is chosen.
//
// "sticky bottom-0" (not "fixed"): the bar stays at the bottom of the screen
// while you scroll, and at the end of the page it rests in its place, so it
// never covers the footer. (Same idea as the mobile bar of the builder.)

import Link from "next/link";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_COMPARE, compareHref } from "@/lib/compare-url";
import { useCompareTray } from "@/lib/use-compare-tray";

type Props = {
  /** The website part, for example "cpu". */
  segment: string;
  /** For example "CPUs". */
  label: string;
};

export function CompareTray({ segment, label }: Props) {
  const { slugs, clear } = useCompareTray(segment);

  if (slugs.length === 0) return null;

  return (
    <section
      aria-label="Parts to compare"
      className="sticky bottom-0 z-30 -mx-4 mt-6 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* aria-live: screen readers say the new count when it changes. */}
        <p className="text-sm" aria-live="polite">
          <span className="font-medium">
            {slugs.length} of {MAX_COMPARE}
          </span>{" "}
          {label} chosen
        </p>

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>

          {slugs.length >= 2 ? (
            <Button asChild size="sm">
              <Link href={compareHref(segment, slugs)}>
                <Scale />
                Compare ({slugs.length})
              </Link>
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">
              Choose one more part
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
