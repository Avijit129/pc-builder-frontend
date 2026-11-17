"use client";

// components/compare/compare-tray.tsx
// The bar at the bottom of a list page: how many parts are chosen, a link to
// the compare page, and a Clear button. It is hidden while nothing is chosen.
//
// "sticky bottom-0" (not "fixed"): the bar stays at the bottom of the screen
// while you scroll, and at the end of the page it rests in its place, so it
// never covers the footer. (Same idea as the mobile bar of the builder.)
//
// Accessibility: the status text below is ALWAYS in the page, even when the
// bar is hidden. A screen reader only says a change in a live region that
// already existed, so a region that appears together with its text is silent.

import { useRef } from "react";
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
  const statusRef = useRef<HTMLParagraphElement>(null);

  const status =
    slugs.length === 0
      ? `No ${label} chosen to compare`
      : `${slugs.length} of ${MAX_COMPARE} ${label} chosen to compare`;

  function handleClear() {
    clear();

    // The bar disappears, and the Clear button that has focus goes with it.
    // Without this, focus falls back to the top of the page. The status text
    // sits at the end of the list, where the bar was. preventScroll: no jump.
    statusRef.current?.focus({ preventScroll: true });
  }

  return (
    <>
      {/* Hidden for the eyes. tabIndex -1: code can focus it, Tab skips it. */}
      <p ref={statusRef} role="status" tabIndex={-1} className="sr-only">
        {status}
      </p>

      {slugs.length > 0 && (
        <section
          aria-label="Parts to compare"
          className="sticky bottom-0 z-30 -mx-4 mt-6 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-medium">
                {slugs.length} of {MAX_COMPARE}
              </span>{" "}
              {label} chosen
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
              >
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
      )}
    </>
  );
}
