"use client";

// components/builder/slot-card.tsx
// One slot of the build (CPU, motherboard, ...): the parts you chose, and the
// button that opens the part picker under it.
//
// Keyboard focus (the picker and the rows disappear while they have focus):
// - After a pick, a remove, or closing the picker, focus goes back to the
//   toggle button of this slot.
// - When a RAM or SSD slot becomes full, the toggle button turns into the text
//   "Limit reached". Then that text gets the focus.
// - Esc closes the picker.

import { useEffect, useRef, type KeyboardEvent } from "react";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartPicker } from "@/components/builder/part-picker";
import { PartThumb } from "@/components/builder/part-thumb";
import {
  SLOTS,
  isRepeatable,
  maxQuantity,
  type BuilderPart,
  type PartItem,
} from "@/lib/builder";
import { formatPrice } from "@/lib/format";
import type { Category } from "@/lib/site";

type Props = {
  category: Category;
  /** Only the parts of THIS type. */
  parts: BuilderPart[];
  isOpen: boolean;
  onToggle: () => void;
  onPick: (item: PartItem) => void;
  onRemove: (id: number) => void;
  onChangeQuantity: (id: number, change: 1 | -1) => void;
};

export function SlotCard({
  category,
  parts,
  isOpen,
  onToggle,
  onPick,
  onRemove,
  onChangeQuantity,
}: Props) {
  const slot = SLOTS[category.type];
  const repeatable = isRepeatable(category.type);
  const max = maxQuantity(category.type);
  const used = parts.reduce((sum, part) => sum + part.quantity, 0);

  // Full only matters for RAM and SSD. A one-slot type can always be changed.
  const isFull = repeatable && used >= max;
  const showPicker = isOpen && !isFull;

  const headingId = `slot-${category.type}-heading`;
  const pickerId = `slot-${category.type}-picker`;

  const toggleRef = useRef<HTMLButtonElement>(null);
  const limitRef = useRef<HTMLSpanElement>(null);
  // true after an action that removes the element that had focus. The effect
  // below puts focus back and sets it to false again.
  const needsFocus = useRef(false);

  // Runs after every render, but does nothing unless needsFocus is true. This
  // way the flag is used up by the FIRST render after the action, so it can
  // never steal focus later (for example from the search field of a picker
  // that opens afterwards). Reading a ref in an effect is fine.
  useEffect(() => {
    if (!needsFocus.current) return;

    needsFocus.current = false;

    // The toggle button is gone when the slot is full ("Limit reached").
    (toggleRef.current ?? limitRef.current)?.focus();
  });

  function handleToggle() {
    // Closing: the button can turn into "Limit reached", so remember to move focus.
    if (isOpen) needsFocus.current = true;

    onToggle();
  }

  function handlePick(item: PartItem) {
    needsFocus.current = true;
    // The toggle button is still here, so focus it BEFORE the picker (and the
    // "Choose" button that has focus) is removed.
    toggleRef.current?.focus();

    onPick(item);
  }

  function handleRemove(id: number) {
    needsFocus.current = true;
    // The row (and its Remove button) is about to disappear.
    toggleRef.current?.focus();

    onRemove(id);
  }

  // Esc anywhere in this slot closes the picker.
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || !isOpen) return;

    event.preventDefault();
    toggleRef.current?.focus();
    handleToggle();
  }

  const actionLabel =
    used === 0 ? "Choose" : repeatable ? "Add another" : "Change";

  const description =
    used === 0
      ? "Nothing chosen yet"
      : repeatable
        ? `${used} of ${max} chosen`
        : null;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border bg-card"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-3 p-4">
        <category.icon
          className="size-6 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="font-medium">
            {slot.title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {isFull && !isOpen ? (
          // tabIndex -1: code can focus it (see the effect), Tab skips it.
          <span
            ref={limitRef}
            tabIndex={-1}
            className="text-sm text-muted-foreground"
          >
            <span className="sr-only">{slot.title}: </span>
            Limit reached
          </span>
        ) : (
          <Button
            ref={toggleRef}
            type="button"
            size="sm"
            variant={used === 0 ? "default" : "outline"}
            aria-expanded={isOpen}
            aria-controls={showPicker ? pickerId : undefined}
            aria-label={`${isOpen ? "Close" : actionLabel} ${slot.noun}`}
            onClick={handleToggle}
          >
            {isOpen ? "Close" : actionLabel}
          </Button>
        )}
      </div>

      {parts.length > 0 && (
        <ul className="divide-y border-t">
          {parts.map(({ item, quantity }) => {
            // Same link shape as the cards: /{segment}/{brand}/{slug}
            const href = item.manufacturer
              ? `/${category.segment}/${item.manufacturer.slug}/${item.slug}`
              : `/${category.segment}/${item.slug}`;

            const price = formatPrice(item.lowest_price);

            return (
              <li key={item.id} className="flex items-center gap-3 p-4">
                <PartThumb category={category} item={item} />

                <div className="min-w-0 flex-1">
                  {item.manufacturer && (
                    <p className="text-xs text-muted-foreground">
                      {item.manufacturer.name}
                    </p>
                  )}

                  {/* New tab, so the build on this page is not lost. */}
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener"
                    className="font-medium leading-snug hover:underline"
                  >
                    {item.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </Link>

                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {price ?? "No in-stock price"}
                    {price && quantity > 1 ? " each" : ""}
                  </p>
                </div>

                {repeatable && (
                  <div
                    role="group"
                    aria-label={`Quantity of ${item.name}`}
                    className="flex items-center gap-1"
                  >
                    {/* aria-disabled, not disabled: a disabled button that has
                        focus loses it. lib/builder.ts (changeQuantity) already
                        ignores a change below 1 or above the limit. */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`One less ${item.name}`}
                      aria-disabled={quantity <= 1 || undefined}
                      onClick={() => onChangeQuantity(item.id, -1)}
                    >
                      <Minus />
                    </Button>

                    <span
                      className="w-6 text-center text-sm"
                      aria-live="polite"
                    >
                      <span className="sr-only">Quantity: </span>
                      {quantity}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`One more ${item.name}`}
                      aria-disabled={isFull || undefined}
                      onClick={() => onChangeQuantity(item.id, 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${item.name} from the build`}
                  onClick={() => handleRemove(item.id)}
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* The picker only exists while open, so it starts fresh every time. */}
      {showPicker && (
        <div id={pickerId} className="border-t p-4">
          <PartPicker
            category={category}
            repeatable={repeatable}
            selectedIds={parts.map((part) => part.item.id)}
            onPick={handlePick}
            autoFocusSearch
          />
        </div>
      )}
    </section>
  );
}
