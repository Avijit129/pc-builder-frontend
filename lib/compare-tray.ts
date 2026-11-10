// lib/compare-tray.ts
// The "compare tray": the parts a visitor chose on the list pages, kept in
// sessionStorage (this browser tab only, cleared when the tab closes).
//
// Shape in storage: { "cpu": ["slug-a", "slug-b"], "gpu": ["slug-c"] }
// One list per category, so choosing CPUs never touches the GPU choices.
//
// No React in this file. Only call these functions in the browser.
// The hook is in lib/use-compare-tray.ts.

import { MAX_COMPARE } from "@/lib/compare-url";
import { CATEGORIES } from "@/lib/site";
import { isValidSlug } from "@/lib/slug";

const KEY = "pc_builder_compare";

type Tray = Record<string, string[]>;

/* -------------------------------------------------------------------------- */
/* The three functions React's useSyncExternalStore needs                     */
/* -------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * The raw text from storage. It is a string on purpose: React compares it
 * with the old value, and the same text is always "the same value".
 * (An object would be new on every call, and React would loop.)
 */
export function getSnapshot(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    // Storage is blocked. The tray is simply empty.
    return "";
  }
}

/** The server has no storage, so it always draws an empty tray. */
export function getServerSnapshot(): string {
  return "";
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

/** Raw text -> a clean tray. Anything strange is dropped. */
export function parseTray(raw: string): Tray {
  if (raw === "") return {};

  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return {};
  }

  const tray: Tray = {};

  // We only read the 8 real segments, so an unknown key is ignored.
  for (const category of CATEGORIES) {
    const value = (data as Record<string, unknown>)[category.segment];

    if (!Array.isArray(value)) continue;

    const slugs = value.filter(
      (slug): slug is string =>
        typeof slug === "string" && isValidSlug(slug),
    );
    const unique = [...new Set(slugs)].slice(0, MAX_COMPARE);

    if (unique.length > 0) tray[category.segment] = unique;
  }

  return tray;
}

/** The chosen slugs of one category. */
export function slugsFor(raw: string, segment: string): string[] {
  return parseTray(raw)[segment] ?? [];
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                    */
/* -------------------------------------------------------------------------- */

function save(tray: Tray): void {
  try {
    if (Object.keys(tray).length === 0) {
      window.sessionStorage.removeItem(KEY);
    } else {
      window.sessionStorage.setItem(KEY, JSON.stringify(tray));
    }
  } catch {
    // Storage is blocked or full. The tray is simply not kept.
  }

  // sessionStorage tells nothing to the page that changed it, so we do.
  listeners.forEach((listener) => listener());
}

/** Add the part, or remove it when it is already chosen. */
export function toggleSlug(segment: string, slug: string): void {
  if (!isValidSlug(slug)) return;

  const tray = parseTray(getSnapshot());
  const current = tray[segment] ?? [];

  let next: string[];

  if (current.includes(slug)) {
    next = current.filter((item) => item !== slug);
  } else if (current.length >= MAX_COMPARE) {
    // Full. The button is disabled, so this is only a safety net.
    return;
  } else {
    next = [...current, slug];
  }

  const updated = { ...tray };

  if (next.length === 0) {
    delete updated[segment];
  } else {
    updated[segment] = next;
  }

  save(updated);
}

/** Remove all chosen parts of one category. */
export function clearSegment(segment: string): void {
  const updated = { ...parseTray(getSnapshot()) };

  delete updated[segment];

  save(updated);
}
