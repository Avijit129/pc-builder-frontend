"use client";

// components/builder/slot-card.tsx
// One slot of the build (CPU, motherboard, ...): the parts you chose, and the
// button that opens the part picker under it.

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

  const actionLabel =
    used === 0 ? "Choose" : repeatable ? "Add another" : "Change";

  const description =
    used === 0
      ? "Nothing chosen yet"
      : repeatable
        ? `${used} of ${max} chosen`
        : null;

  return (
    <section aria-labelledby={headingId} className="rounded-xl border bg-card">
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
          <span className="text-sm text-muted-foreground">Limit reached</span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant={used === 0 ? "default" : "outline"}
            aria-expanded={isOpen}
            aria-controls={showPicker ? pickerId : undefined}
            aria-label={`${isOpen ? "Close" : actionLabel} ${slot.noun}`}
            onClick={onToggle}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      aria-label={`One less ${item.name}`}
                      disabled={quantity <= 1}
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
                      size="icon-xs"
                      aria-label={`One more ${item.name}`}
                      disabled={isFull}
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
                  onClick={() => onRemove(item.id)}
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
            onPick={onPick}
          />
        </div>
      )}
    </section>
  );
}
