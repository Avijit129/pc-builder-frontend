"use client";

// components/builder/builder-app.tsx
// The whole PC Builder. It keeps the list of chosen parts in React state and
// gives each slot card what it needs. Nothing is saved: a refresh starts a new
// build (saving comes with accounts, step G).

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SlotCard } from "@/components/builder/slot-card";
import { CompatibilityPanel } from "@/components/builder/compatibility-panel";
import {
  addPart,
  changeQuantity,
  estimatePrice,
  partsOfType,
  removePart,
  type BuilderPart,
} from "@/lib/builder";
import { formatPrice } from "@/lib/format";
import { CATEGORIES } from "@/lib/site";
import type { ComponentType } from "@/lib/types";

export function BuilderApp() {
  const [parts, setParts] = useState<BuilderPart[]>([]);
  // Which slot has its picker open. Only one at a time.
  const [openType, setOpenType] = useState<ComponentType | null>(null);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <ul className="space-y-4">
        {CATEGORIES.map((category) => {
          const type = category.type;

          return (
            <li key={type}>
              <SlotCard
                category={category}
                parts={partsOfType(parts, type)}
                isOpen={openType === type}
                onToggle={() =>
                  setOpenType((current) => (current === type ? null : type))
                }
                onPick={(item) => {
                  // (current) => ... always works with the newest list.
                  setParts((current) => addPart(current, type, item));
                  setOpenType(null);
                }}
                onRemove={(id) =>
                  setParts((current) => removePart(current, type, id))
                }
                onChangeQuantity={(id, change) =>
                  setParts((current) =>
                    changeQuantity(current, type, id, change),
                  )
                }
              />
            </li>
          );
        })}
      </ul>

      {/* Sticky on wide screens. If the panel is taller than the screen, it
          scrolls inside itself (max-h + overflow). lg:p-1 keeps the focus
          rings from being cut off. */}
      <aside
        aria-label="Build summary and compatibility"
        className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:p-1"
      >
        <BuildSummary
          parts={parts}
          onClear={() => {
            setParts([]);
            setOpenType(null);
          }}
        />
        <CompatibilityPanel parts={parts} />
      </aside>
    </div>
  );
}

function BuildSummary({
  parts,
  onClear,
}: {
  parts: BuilderPart[];
  onClear: () => void;
}) {
  const count = parts.reduce((sum, part) => sum + part.quantity, 0);
  const estimate = estimatePrice(parts);

  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-xl border bg-card p-4"
    >
      <h2 id="summary-heading" className="font-medium">
        Your build
      </h2>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Parts</dt>
          <dd>{count}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Estimated price</dt>
          <dd className="font-semibold">
            {estimate.total === null ? (
              <span className="font-normal text-muted-foreground">
                No prices yet
              </span>
            ) : estimate.unpricedParts > 0 ? (
              `At least ${formatPrice(estimate.total)}`
            ) : (
              formatPrice(estimate.total)
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        The price adds the lowest in-stock price of each part.
        {estimate.unpricedParts > 0 &&
          ` ${estimate.unpricedParts} ${
            estimate.unpricedParts === 1 ? "part has" : "parts have"
          } no in-stock price and ${
            estimate.unpricedParts === 1 ? "is" : "are"
          } not counted.`}
      </p>

      {parts.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            // A clear button is easy to press by mistake, so we ask first.
            if (window.confirm("Remove all parts from this build?")) onClear();
          }}
        >
          Clear build
        </Button>
      )}
    </section>
  );
}
