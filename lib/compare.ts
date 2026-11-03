// lib/compare.ts
// The logic of the compare page (server side, no React).
//
// 1. parseCompareSlugs: reads ?items=a,b,c from the URL and cleans it.
// 2. buildCompareSections: turns the specs of several parts into ONE table
//    (rows = specs, one cell per part).

import { buildSpecSections } from "@/lib/detail-specs";
import { isValidSlug } from "@/lib/get-component";
import { MAX_COMPARE } from "@/lib/compare-url";
import type { RawSearchParams } from "@/lib/list-params";
import type { Specs } from "@/lib/types";

/**
 * The clean list of slugs from the URL. A bad value is dropped (the page still
 * works), a double value counts once, and at most MAX_COMPARE are kept.
 */
export function parseCompareSlugs(raw: RawSearchParams): string[] {
  // ?items=a&items=b gives an array. We only use the first value.
  const value = Array.isArray(raw.items) ? raw.items[0] : raw.items;

  const slugs = (value ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(isValidSlug);

  return [...new Set(slugs)].slice(0, MAX_COMPARE);
}

export type CompareCell = {
  /** Text for the screen. "Unknown" when the data is missing. */
  value: string;
  /** false when the value is "Unknown", so the page can show it quieter. */
  known: boolean;
};

export type CompareRow = {
  /** The column name from the API. Used as the React key. */
  key: string;
  label: string;
  /** One cell per part, in the same order as the parts. */
  cells: CompareCell[];
};

export type CompareSection = {
  key: string;
  title: string;
  rows: CompareRow[];
};

const UNKNOWN: CompareCell = { value: "Unknown", known: false };

/**
 * One table for all parts. The groups and rows keep the order of the first
 * part. A group or row that only another part has is added after them.
 * If a part has no value for a row, its cell says "Unknown".
 */
export function buildCompareSections(specsList: Specs[]): CompareSection[] {
  // buildSpecSections (lib/detail-specs.ts) gives readable labels and units.
  const perPart = specsList.map(buildSpecSections);

  // group key -> { title, row key -> label }
  const merged = new Map<
    string,
    { title: string; rows: Map<string, string> }
  >();

  for (const sections of perPart) {
    for (const section of sections) {
      let target = merged.get(section.key);

      if (target === undefined) {
        target = { title: section.title, rows: new Map() };
        merged.set(section.key, target);
      }

      for (const row of section.rows) {
        if (!target.rows.has(row.key)) target.rows.set(row.key, row.label);
      }
    }
  }

  return [...merged].map(([sectionKey, section]) => ({
    key: sectionKey,
    title: section.title,
    rows: [...section.rows].map(([rowKey, label]) => ({
      key: rowKey,
      label,
      cells: perPart.map((sections) => {
        const row = sections
          .find((candidate) => candidate.key === sectionKey)
          ?.rows.find((candidate) => candidate.key === rowKey);

        return row ? { value: row.value, known: row.known } : UNKNOWN;
      }),
    })),
  }));
}
