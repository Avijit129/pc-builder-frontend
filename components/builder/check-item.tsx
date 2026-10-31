// components/builder/check-item.tsx
// One compatibility check: an icon, the message, and a link to the source.
// Never colour alone: every status also has its own icon and a hidden text
// for screen readers.

import {
  Check,
  ExternalLink,
  Info,
  Minus,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { STATUS_LABELS } from "@/lib/compatibility";
import { cn } from "@/lib/utils";
import type { CompatibilityCheck, CompatibilityStatus } from "@/lib/types";

// "unknown" is grey on purpose: it must never look like a pass.
const STATUS_STYLE: Record<
  CompatibilityStatus,
  { icon: LucideIcon; className: string }
> = {
  fail: { icon: X, className: "text-destructive" },
  warning: {
    icon: TriangleAlert,
    className: "text-amber-600 dark:text-amber-500",
  },
  unknown: { icon: Info, className: "text-muted-foreground" },
  pass: { icon: Check, className: "text-green-700 dark:text-green-500" },
  not_applicable: { icon: Minus, className: "text-muted-foreground" },
};

export function StatusIcon({
  status,
  className,
}: {
  status: CompatibilityStatus;
  className?: string;
}) {
  const style = STATUS_STYLE[status];

  return (
    <style.icon
      className={cn("size-4 shrink-0", style.className, className)}
      aria-hidden="true"
    />
  );
}

// Only normal web links become clickable. (The same helper exists in
// type-extras.tsx. We can move both to lib/format.ts later.)
function safeHttpUrl(url: string | null | undefined): string | null {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim())
    ? url.trim()
    : null;
}

type Props = {
  check: CompatibilityCheck;
  /** For a RAM or SSD check: the name of that part. Otherwise null. */
  subjectName: string | null;
};

export function CheckItem({ check, subjectName }: Props) {
  const href = safeHttpUrl(check.evidence?.source_url);
  const sourceName = check.evidence?.source_name?.trim() || "Source";

  return (
    <li className="flex gap-2.5 py-2.5 text-sm">
      <StatusIcon status={check.status} className="mt-0.5" />

      <div className="min-w-0">
        <p className="break-words">
          <span className="sr-only">{STATUS_LABELS[check.status]}: </span>
          {subjectName && <span className="font-medium">{subjectName}: </span>}
          {check.message}
        </p>

        {href && (
          <p className="mt-1 text-xs">
            {/* "nofollow": we do not vouch for the other site. */}
            <a
              href={href}
              target="_blank"
              rel="nofollow noopener"
              className="inline-flex items-center gap-1 text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {sourceName}
              <ExternalLink className="size-3" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        )}
      </div>
    </li>
  );
}
