// components/builder/compatibility-result.tsx
// Draws ONE compatibility result: the status box, the problems, the checks we
// could not run, the missing parts, the power estimate and the passed checks.
//
// No hooks and no "use client" on purpose, so two places can use it:
// - the builder panel (a Client Component), and
// - the shared build page (a Server Component).

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
import { cn } from "@/lib/utils";

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

type Props = {
  result: BuildCheckResult;
  /** Used to write the name of a RAM kit or SSD in front of its checks. */
  parts: BuilderPart[];
  /** true while a newer check runs: the old result is shown faded. */
  loading?: boolean;
};

export function CompatibilityResultView({
  result,
  parts,
  loading = false,
}: Props) {
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
