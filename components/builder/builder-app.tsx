"use client";

// components/builder/builder-app.tsx
// The whole PC Builder. It keeps the list of chosen parts in React state and
// gives each slot card what it needs. A refresh starts a new build. The only
// thing we keep is a draft in sessionStorage while the user logs in (G2a).

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CompatibilityPanel } from "@/components/builder/compatibility-panel";
import { MobileStatusBar } from "@/components/builder/mobile-status-bar";
import { SavePanel } from "@/components/builder/save-panel";
import { SlotCard } from "@/components/builder/slot-card";
import {
  addPart,
  changeQuantity,
  describeEstimate,
  estimatePrice,
  partsOfType,
  removePart,
  type BuilderPart,
} from "@/lib/builder";
import { clearDraft, loadDraft } from "@/lib/draft";
import { CATEGORIES } from "@/lib/site";
import type { ComponentType } from "@/lib/types";
import { useBuildCheck } from "@/lib/use-build-check";

export function BuilderApp() {
  const [parts, setParts] = useState<BuilderPart[]>([]);
  // Which slot has its picker open. Only one at a time.
  const [openType, setOpenType] = useState<ComponentType | null>(null);
  // The name of the build (optional).
  const [name, setName] = useState("");
  // null = not saved yet. After the first save: the slug Laravel made.
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  // ONE check for the whole page. The side panel and the mobile bar both read
  // it, so a change sends one request, not two.
  const check = useBuildCheck(parts);

  // Bring back the build that was kept while the user logged in. It must run
  // in the browser (sessionStorage), so it cannot be the start value of
  // useState: the server would render something different (hydration error).
  // setState is called inside .then(), not in the body of the effect (the
  // strict lint rule), the same pattern as the other hooks.
  useEffect(() => {
    const draft = loadDraft();

    if (draft === null) return;

    void Promise.resolve().then(() => {
      setParts(draft.parts);
      setName(draft.name);
      // Restore only ONCE: delete the draft right away.
      clearDraft();
    });
  }, []);

  function clearBuild() {
    setParts([]);
    setOpenType(null);
    // "Clear" means a new build, so it must not change the saved one.
    setName("");
    setSavedSlug(null);
  }

  return (
    <>
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
            rings from being cut off. The id is the target of the "Details"
            link in the mobile bar. scroll-mt-20: the sticky header (h-16)
            must not cover the top when someone jumps here. */}
        <aside
          id="build-summary"
          aria-label="Build summary and compatibility"
          className="scroll-mt-20 space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:p-1"
        >
          <BuildSummary parts={parts} onClear={clearBuild} />
          <SavePanel
            parts={parts}
            name={name}
            onNameChange={setName}
            savedSlug={savedSlug}
            onSlugChange={setSavedSlug}
          />
          <CompatibilityPanel parts={parts} check={check} />
        </aside>
      </div>

      <MobileStatusBar parts={parts} check={check} />
    </>
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
  const price = describeEstimate(estimate);

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
            {price ?? (
              <span className="font-normal text-muted-foreground">
                No prices yet
              </span>
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
