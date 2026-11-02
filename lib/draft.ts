// lib/draft.ts
// Keeps the build in sessionStorage while the user goes to the login page.
// sessionStorage lives only in this browser tab and is cleared when the tab
// closes, so an old build can never come back days later.
//
// Only call these functions in the browser (in an effect or a click handler).

import {
  addPart,
  maxQuantity,
  type BuilderPart,
  type PartItem,
} from "@/lib/builder";
import { CATEGORIES } from "@/lib/site";
import type { ComponentType } from "@/lib/types";

const KEY = "pc_builder_draft";

export type Draft = { name: string; parts: BuilderPart[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isComponentType(value: unknown): value is ComponentType {
  return CATEGORIES.some((category) => category.type === value);
}

// One saved row -> a part, or null when the row looks wrong.
function readPart(row: unknown): BuilderPart | null {
  if (!isRecord(row)) return null;

  const type = row.type;
  const item = row.item;
  const quantity = row.quantity;

  if (!isComponentType(type) || !isRecord(item)) return null;

  if (
    typeof item.id !== "number" ||
    typeof item.name !== "string" ||
    typeof item.slug !== "string"
  ) {
    return null;
  }

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > maxQuantity(type)
  ) {
    return null;
  }

  return { type, item: item as PartItem, quantity };
}

export function saveDraft(draft: Draft): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage is blocked or full. The build is simply not kept.
  }
}

/** The saved build, or null when there is none (or it is not readable). */
export function loadDraft(): Draft | null {
  let raw: string | null;

  try {
    raw = window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }

  if (raw === null) return null;

  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(data) || !Array.isArray(data.parts)) return null;

  // We add the parts one by one with addPart, the same function the builder
  // uses. So the rules (one CPU, at most 4 RAM kits, ...) apply again and a
  // changed draft can never break them.
  let parts: BuilderPart[] = [];

  for (const row of data.parts) {
    const part = readPart(row);

    if (part === null) continue;

    for (let count = 0; count < part.quantity; count++) {
      parts = addPart(parts, part.type, part.item);
    }
  }

  if (parts.length === 0) return null;

  return {
    name: typeof data.name === "string" ? data.name.slice(0, 100) : "",
    parts,
  };
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}
