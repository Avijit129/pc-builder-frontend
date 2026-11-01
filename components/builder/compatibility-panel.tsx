"use client";

// components/builder/compatibility-panel.tsx
// Shows the result of the compatibility check. The check itself runs in
// useBuildCheck (lib/use-build-check.ts), which BuilderApp calls once.

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CheckItem, StatusIcon } from "@/components/builder/check-item";
import { SLOTS, type BuilderPart } from "@/lib/builder";
import { OVERALL_TEXT, countText, sortChecks } from "@/lib/compatibility";
import { formatNumber } from "@/lib/format";
import type {
  BuildCheckResult,
  CompatibilityCheck,
  CompatibilityStatus,
  PowerRequirement,
} from "@/lib/types";
import type { BuildCheckState } from "@/lib/use-build-check";
import { cn } from "@/lib/utils";

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
      <ResultView result={check.result} parts={parts} loading={check.loading} />
    );
  }

  return (
    <section
      aria-labelledby="compat-heading"
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="compat-heading" className="font-medium">
          Compatibility
        </h2>
        {/* A live region: screen readers say "Checking…" when it appears. */}
        <span role="status" className="text-xs text-muted-foreground">
          {check.loading ? "Checking…" : ""}
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

/* -------------------------------------------------------------------------- */
/* The answer                                                                 */
/* -------------------------------------------------------------------------- */

const BORDER: Record<CompatibilityStatus, string> = {
  fail: "border-destructive/50",
  warning: "border-amber-500/50",
  unknown: "",
  pass: "",
  not_applicable: "",
};

// A check about one RAM kit or SSD says which one.
function subjectName(
  check: CompatibilityCheck,
  parts: BuilderPart[],
): string | null {
  const subject = check.subject;

  if (subject === null) return null;

  const part = parts.find(
    (p) => p.type === subject.type && p.item.id === subject.id,
  );

  return part ? part.item.name : null;
}

function ResultView({
  result,
  parts,
  loading,
}: {
  result: BuildCheckResult;
  parts: BuilderPart[];
  loading: boolean;
}) {
  const overall = OVERALL_TEXT[result.status];
  const counts = countText(result.checks);

  // "issues" is only fail and warning. Worst first.
  const attention = sortChecks(result.issues);
  const unknown = result.checks.filter((check) => check.status === "unknown");
  const passed = sortChecks(
    result.checks.filter(
      (check) => check.status === "pass" || check.status === "not_applicable",
    ),
  );

  return (
    <div
      aria-busy={loading}
      className={cn("mt-3 space-y-5", loading && "opacity-60")}
    >
      <div
        className={cn(
          "flex gap-3 rounded-lg border p-3",
          BORDER[result.status],
        )}
      >
        <StatusIcon status={result.status} className="mt-0.5 size-5" />
        <div>
          <p className="font-medium">{overall.title}</p>
          <p className="text-sm text-muted-foreground">{overall.text}</p>
          {counts !== "" && (
            <p className="mt-1 text-xs text-muted-foreground">{counts}</p>
          )}
        </div>
      </div>

      <CheckGroup
        title="Needs your attention"
        checks={attention}
        parts={parts}
      />
      <CheckGroup title="Could not check" checks={unknown} parts={parts} />

      {/* A missing part is a to-do, not an error (API reference, section 6). */}
      {result.missing_components.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Still to choose: </span>
          {result.missing_components
            .map((type) => SLOTS[type].title)
            .join(", ")}
        </p>
      )}

      <PowerBox power={result.power_requirement} />

      {passed.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium">
            Passed and skipped checks ({passed.length})
          </summary>
          <CheckList checks={passed} parts={parts} />
        </details>
      )}
    </div>
  );
}

function CheckList({
  checks,
  parts,
}: {
  checks: CompatibilityCheck[];
  parts: BuilderPart[];
}) {
  return (
    <ul className="mt-1 divide-y">
      {checks.map((check, index) => (
        // The API sends no id for a check, so the key uses the position.
        // This is fine: the list is replaced as a whole, never edited.
        <CheckItem
          key={`${index}-${check.rule}`}
          check={check}
          subjectName={subjectName(check, parts)}
        />
      ))}
    </ul>
  );
}

function CheckGroup({
  title,
  checks,
  parts,
}: {
  title: string;
  checks: CompatibilityCheck[];
  parts: BuilderPart[];
}) {
  if (checks.length === 0) return null;

  return (
    <section>
      <h3 className="text-sm font-medium">{title}</h3>
      <CheckList checks={checks} parts={parts} />
    </section>
  );
}

// Only shown when the API could work out a number (it needs a CPU, and a GPU
// for the full estimate). It is a rough guess, and we say so.
function PowerBox({ power }: { power: PowerRequirement | null }) {
  if (power === null || power.estimated_load_watts === null) return null;

  const { cpu, gpu } = power.tdp_watts_profiles;

  const sources = [
    typeof cpu === "number" ? `CPU ${formatNumber(cpu)} W` : null,
    typeof gpu === "number" ? `GPU ${formatNumber(gpu)} W` : null,
    `${formatNumber(power.base_system_watts)} W for the rest of the system`,
  ]
    .filter((part): part is string => part !== null)
    .join(" + ");

  return (
    <section>
      <h3 className="text-sm font-medium">Power estimate</h3>

      <dl className="mt-2 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Estimated use</dt>
          <dd>About {formatNumber(power.estimated_load_watts)} W</dd>
        </div>

        {power.recommended_psu_wattage !== null && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Recommended power supply</dt>
            <dd className="font-medium">
              {formatNumber(power.recommended_psu_wattage)} W or more
            </dd>
          </div>
        )}
      </dl>

      <p className="mt-2 text-xs text-muted-foreground">
        {sources}. This is a rough estimate.
      </p>
    </section>
  );
}
