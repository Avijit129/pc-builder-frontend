// lib/compatibility.ts
// Helpers for the compatibility check (docs/frontend-api.md, section 6).
// No React in this file.

import type { BuilderPart } from "@/lib/builder";
import type {
  CompatibilityBody,
  CompatibilityCheck,
  CompatibilityStatus,
  ComponentType,
} from "@/lib/types";

// The request key of each one-slot type. Note: a case is "case_id" in the
// request, but its type key is "pc_case" (API reference, section 2).
type SingleKey = Exclude<
  keyof CompatibilityBody,
  "ram_id" | "ram_ids" | "ssd_id" | "ssd_ids"
>;

const SINGLE_KEYS: Record<Exclude<ComponentType, "ram" | "ssd">, SingleKey> = {
  cpu: "cpu_id",
  motherboard: "motherboard_id",
  gpu: "gpu_id",
  psu: "psu_id",
  pc_case: "case_id",
  cpu_cooler: "cpu_cooler_id",
};

// A fixed order, so the same build always gives exactly the same body text.
// (Otherwise "replace the CPU with the same CPU" would look like a change.)
const TYPE_ORDER: ComponentType[] = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "ssd",
  "psu",
  "pc_case",
  "cpu_cooler",
];

/**
 * The body for POST /api/compatibility/check-build.
 * Returns null when the build has fewer than 2 DIFFERENT kinds of part:
 * Laravel would answer 422, so we do not even ask.
 *
 * RAM and SSD go in as a list. The same id twice means two copies, so a
 * quantity of 2 becomes [id, id].
 */
export function buildCompatibilityBody(
  parts: BuilderPart[],
): CompatibilityBody | null {
  const types = TYPE_ORDER.filter((type) =>
    parts.some((part) => part.type === type),
  );

  if (types.length < 2) return null;

  const body: CompatibilityBody = {};

  for (const type of types) {
    const ofType = parts.filter((part) => part.type === type);

    if (type === "ram" || type === "ssd") {
      const ids = ofType
        .flatMap((part) =>
          Array.from({ length: part.quantity }, () => part.item.id),
        )
        .sort((a, b) => a - b);

      if (type === "ram") {
        body.ram_ids = ids;
      } else {
        body.ssd_ids = ids;
      }

      continue;
    }

    // A one-slot type has exactly one part (see lib/builder.ts, addPart).
    body[SINGLE_KEYS[type]] = ofType[0].item.id;
  }

  return body;
}

/* -------------------------------------------------------------------------- */
/* Status texts                                                               */
/* -------------------------------------------------------------------------- */

/** Worst first. Same order as the API uses for the overall status. */
export const STATUS_ORDER: CompatibilityStatus[] = [
  "fail",
  "warning",
  "unknown",
  "pass",
  "not_applicable",
];

/** Short names, also read by screen readers in front of every check. */
export const STATUS_LABELS: Record<CompatibilityStatus, string> = {
  fail: "Problem",
  warning: "Warning",
  unknown: "Could not check",
  pass: "OK",
  not_applicable: "Not applicable",
};

/** The big message at the top of the panel, for the OVERALL status. */
export const OVERALL_TEXT: Record<
  CompatibilityStatus,
  { title: string; text: string }
> = {
  fail: {
    title: "Problems found",
    text: "Some parts will not work together. See below.",
  },
  warning: {
    title: "Check the warnings",
    text: "The build can work, but some things need a second look.",
  },
  unknown: {
    title: "Could not check everything",
    text: "We are missing data for some checks. This does not mean the parts fit.",
  },
  pass: {
    title: "No problems found",
    text: "Every check we could run passed.",
  },
  not_applicable: {
    title: "Nothing to compare yet",
    text: "These parts have no checks between them. Add more parts to see results.",
  },
};

/** Worst first. The sort is stable, so equal checks keep the API order. */
export function sortChecks(checks: CompatibilityCheck[]): CompatibilityCheck[] {
  return [...checks].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  );
}
