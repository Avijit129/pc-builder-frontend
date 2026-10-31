// lib/builder.ts
// The rules of the PC Builder page. No React in this file, only plain functions.
// Every function returns a NEW list and never changes the old one. This is what
// React state needs.

import type { ComponentType, ListItem } from "@/lib/types";

/** One part, exactly as a list endpoint sends it (same as a card on a list page). */
export type PartItem = ListItem<Record<string, unknown>>;

export type BuilderPart = {
  type: ComponentType;
  item: PartItem;
  /** Always 1 for one-slot types. RAM kits and SSDs can be more. */
  quantity: number;
};

/** Names for the builder: "title" is a heading, "noun" is used inside sentences. */
export const SLOTS: Record<ComponentType, { title: string; noun: string }> = {
  cpu: { title: "CPU", noun: "CPU" },
  gpu: { title: "Graphics card", noun: "graphics card" },
  motherboard: { title: "Motherboard", noun: "motherboard" },
  ram: { title: "Memory (RAM)", noun: "RAM kit" },
  ssd: { title: "Storage (SSD)", noun: "SSD" },
  psu: { title: "Power supply", noun: "power supply" },
  pc_case: { title: "Case", noun: "case" },
  cpu_cooler: { title: "CPU cooler", noun: "CPU cooler" },
};

// These limits are copied from Laravel (BuildPartsRules and CheckCompatibilityRequest)
// only so the buttons can be disabled. Laravel still checks everything.
// A type that is not listed here is a one-slot type.
const MAX_TOTAL: Partial<Record<ComponentType, number>> = {
  ram: 4,
  ssd: 8,
};

/** How many of this type a build may hold (counting quantity). */
export function maxQuantity(type: ComponentType): number {
  return MAX_TOTAL[type] ?? 1;
}

/** RAM and SSD can be added more than once. All other types have one slot. */
export function isRepeatable(type: ComponentType): boolean {
  return maxQuantity(type) > 1;
}

export function partsOfType(
  parts: BuilderPart[],
  type: ComponentType,
): BuilderPart[] {
  return parts.filter((part) => part.type === type);
}

export function totalQuantity(
  parts: BuilderPart[],
  type: ComponentType,
): number {
  return partsOfType(parts, type).reduce((sum, part) => sum + part.quantity, 0);
}

/**
 * Add a part.
 * - One-slot type: the new part REPLACES the old one.
 * - RAM or SSD: the same part again adds +1 to its quantity, a new part is a
 *   new row. If the limit is reached, nothing changes.
 */
export function addPart(
  parts: BuilderPart[],
  type: ComponentType,
  item: PartItem,
): BuilderPart[] {
  if (!isRepeatable(type)) {
    return [
      ...parts.filter((part) => part.type !== type),
      { type, item, quantity: 1 },
    ];
  }

  if (totalQuantity(parts, type) >= maxQuantity(type)) return parts;

  const existing = parts.find(
    (part) => part.type === type && part.item.id === item.id,
  );

  if (existing) {
    return parts.map((part) =>
      part === existing ? { ...part, quantity: part.quantity + 1 } : part,
    );
  }

  return [...parts, { type, item, quantity: 1 }];
}

export function removePart(
  parts: BuilderPart[],
  type: ComponentType,
  id: number,
): BuilderPart[] {
  return parts.filter((part) => !(part.type === type && part.item.id === id));
}

/** Change a quantity by +1 or -1. It never goes below 1 or above the limit. */
export function changeQuantity(
  parts: BuilderPart[],
  type: ComponentType,
  id: number,
  change: 1 | -1,
): BuilderPart[] {
  const part = parts.find((p) => p.type === type && p.item.id === id);

  if (!part) return parts;

  const next = part.quantity + change;

  if (next < 1) return parts;

  if (change > 0 && totalQuantity(parts, type) >= maxQuantity(type)) {
    return parts;
  }

  return parts.map((p) => (p === part ? { ...p, quantity: next } : p));
}

export type PriceEstimate = {
  /** null when no part has an in-stock price. */
  total: number | null;
  pricedParts: number;
  /** Parts without an in-stock price. They are NOT in the total. */
  unpricedParts: number;
};

/**
 * Adds the lowest in-stock price of every part, times its quantity. Same idea
 * as "pricing" on the shared build page: when unpricedParts is above 0 the
 * total is only partial, so the page must say "at least".
 */
export function estimatePrice(parts: BuilderPart[]): PriceEstimate {
  let total = 0;
  let pricedParts = 0;
  let unpricedParts = 0;

  for (const part of parts) {
    const price = part.item.lowest_price;

    if (typeof price !== "number") {
      unpricedParts++;
      continue;
    }

    total += price * part.quantity;
    pricedParts++;
  }

  return {
    total: pricedParts === 0 ? null : Math.round(total * 100) / 100,
    pricedParts,
    unpricedParts,
  };
}
