// components/builder/mobile-status-bar.tsx
// A slim bar at the bottom of the screen on phones and tablets (below "lg"):
// the compatibility status, the price, and a link to the full panel.
// On wide screens the side panel is always visible, so this bar is hidden.
//
// "sticky bottom-0" (not "fixed"): the bar stays at the bottom of the screen
// while you work, but at the end of the page it rests above the footer, so it
// never covers it.

import { StatusIcon } from "@/components/builder/check-item";
import {
  describeEstimate,
  estimatePrice,
  type BuilderPart,
} from "@/lib/builder";
import { OVERALL_TEXT, countText } from "@/lib/compatibility";
import type { CompatibilityStatus } from "@/lib/types";
import type { BuildCheckState } from "@/lib/use-build-check";

type Props = {
  parts: BuilderPart[];
  check: BuildCheckState;
};

export function MobileStatusBar({ parts, check }: Props) {
  const count = parts.reduce((sum, part) => sum + part.quantity, 0);
  const price = describeEstimate(estimatePrice(parts));

  // The icon only appears for a real, current result.
  let status: CompatibilityStatus | null = null;
  let text: string;
  let detail: string | null = null;

  if (count === 0) {
    text = "Your build is empty";
  } else if (!check.enabled) {
    text = "Add another kind of part to check";
  } else if (check.error) {
    text = "The check failed";
    detail = "Open the details to try again";
  } else if (check.loading || check.result === null) {
    // While a new check runs, the old result is not current. Do not show it.
    text = "Checking…";
  } else {
    status = check.result.status;
    text = OVERALL_TEXT[status].title;
    detail = countText(check.result.checks) || null;
  }

  return (
    <section
      aria-label="Build status"
      className="sticky bottom-0 z-30 -mx-4 mt-6 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden"
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {status !== null && <StatusIcon status={status} className="size-5" />}

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{text}</p>
            {detail !== null && (
              <p className="truncate text-xs text-muted-foreground">{detail}</p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">
            {price ?? (
              <span className="font-normal text-muted-foreground">
                No prices yet
              </span>
            )}
          </p>
          {/* A normal link to an id on this page. */}
          <a
            href="#build-summary"
            className="inline-block py-1 text-xs underline underline-offset-4"
          >
            Details
          </a>
        </div>
      </div>
    </section>
  );
}
