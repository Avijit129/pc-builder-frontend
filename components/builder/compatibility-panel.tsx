"use client";

// components/builder/compatibility-panel.tsx
// The compatibility box of the builder page. The check itself runs in
// useBuildCheck (lib/use-build-check.ts), which BuilderApp calls once. The
// drawing of the result is in compatibility-result.tsx, which the shared build
// page uses too.

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CompatibilityResultView } from "@/components/builder/compatibility-result";
import type { BuilderPart } from "@/lib/builder";
import { OVERALL_TEXT, countText } from "@/lib/compatibility";
import type { BuildCheckState } from "@/lib/use-build-check";

type Props = {
  parts: BuilderPart[];
  check: BuildCheckState;
};

export function CompatibilityPanel({ parts, check }: Props) {
  let content: ReactNode;

  if (!check.enabled) {
    content = (
      <p className="mt-3 text-sm text-muted-foreground">
        Choose at least two kinds of parts, for example a CPU and a motherboard,
        to check if they fit together.
      </p>
    );
  } else if (check.error) {
    content = (
      <div
        role="alert"
        className="mt-3 rounded-lg border border-destructive/40 p-4 text-sm"
      >
        <p>{check.error}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={check.retry}
        >
          Try again
        </Button>
      </div>
    );
  } else if (check.result === null) {
    content = (
      <div className="mt-3 space-y-2" aria-hidden="true">
        <div className="h-16 animate-pulse rounded-lg border bg-muted/50" />
        <div className="h-10 animate-pulse rounded-lg border bg-muted/50" />
      </div>
    );
  } else {
    content = (
      <CompatibilityResultView
        result={check.result}
        parts={parts}
        loading={check.loading}
      />
    );
  }

  // What a screen reader says when a check has finished, for example
  // "Problems found. 2 problems, 1 warning". It is empty while a check runs,
  // so every finished check is a new message. (The result box itself cannot
  // be the live region: it appears together with its text, so nothing would
  // be said for the first result.)
  const summary =
    check.enabled && !check.loading && !check.error && check.result !== null
      ? [
          OVERALL_TEXT[check.result.status].title,
          countText(check.result.checks).replace(/ · /g, ", "),
        ]
          .filter((part) => part !== "")
          .join(". ")
      : "";

  return (
    <section
      aria-labelledby="compat-heading"
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="compat-heading" className="font-medium">
          Compatibility
        </h2>
        {/* One live region that is always in the page. It says "Checking…"
            while a check runs, and then the hidden summary of the result. */}
        <span role="status" className="text-xs text-muted-foreground">
          {check.loading ? (
            "Checking…"
          ) : (
            <span className="sr-only">{summary}</span>
          )}
        </span>
      </div>

      {content}

      <p className="mt-4 text-xs text-muted-foreground">
        Checks use the specs in our database. Please confirm on the maker&apos;s
        page before you buy.
      </p>
    </section>
  );
}
