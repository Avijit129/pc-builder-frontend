// lib/list-filters.ts
// The extra filters of each list page (on top of search, sort and brand).
// To add a filter later, add one entry here. The toolbar, the URL cleaning
// and the API call all read from this file, so nothing else needs to change.
//
// The min and max values of number filters copy the Laravel validation rules,
// because Laravel answers 422 for a value outside them
// (docs/frontend-api.md, section 3).
//
// The options of select filters are the EXACT values saved in the database,
// because the API filters are exact matches ("DDR5" must be written "DDR5").
// They were read from the database with php artisan tinker.
// IMPORTANT: if you add a new socket, memory type or size to the database
// (for example a new socket like "AM6"), add it here too, or the filter will
// not show it.

import type { ComponentType } from "@/lib/types";

type FilterBase = {
  /** The URL and API parameter name, for example "max_length_mm". */
  key: string;
  /** The text above the field. */
  label: string;
};

/** A whole number between min and max. */
export type NumberFilter = FilterBase & {
  kind: "number";
  min: number;
  max: number;
  placeholder: string;
};

/** One value out of a fixed list. */
export type SelectFilter = FilterBase & {
  kind: "select";
  /** Exact values from the API, for example "AM5". */
  options: string[];
};

export type FilterDef = NumberFilter | SelectFilter;

/* -------------------------------------------------------------------------- */
/* Filters that several lists share                                           */
/* -------------------------------------------------------------------------- */

// Used by CPUs, motherboards and CPU coolers.
const SOCKET_FILTER: SelectFilter = {
  key: "socket",
  label: "Socket",
  kind: "select",
  options: ["AM4", "AM5", "LGA1200", "LGA1700", "LGA1851"],
};

// Used by CPUs, motherboards and RAM.
const MEMORY_TYPE_FILTER: SelectFilter = {
  key: "memory_type",
  label: "Memory type",
  kind: "select",
  options: ["DDR4", "DDR5"],
};

// The motherboard sizes. Used by motherboards (its own size) and by cases
// (the sizes the case can hold).
const BOARD_SIZES = ["ATX", "E-ATX", "Micro-ATX", "Mini-ITX"];

/* -------------------------------------------------------------------------- */
/* Filters per list                                                           */
/* -------------------------------------------------------------------------- */

export const LIST_FILTERS: Record<ComponentType, FilterDef[]> = {
  cpu: [SOCKET_FILTER, MEMORY_TYPE_FILTER],

  gpu: [
    {
      key: "max_length_mm",
      label: "Max length (mm)",
      kind: "number",
      min: 1,
      max: 1000,
      placeholder: "For example 320",
    },
  ],

  motherboard: [
    SOCKET_FILTER,
    MEMORY_TYPE_FILTER,
    {
      key: "form_factor",
      label: "Size",
      kind: "select",
      options: BOARD_SIZES,
    },
  ],

  ram: [MEMORY_TYPE_FILTER],

  ssd: [
    {
      // Laravel matches this as "starts with". "M.2" finds every M.2 size
      // (today only "M.2 2280"), so a new size later is included automatically.
      key: "form_factor",
      label: "Size",
      kind: "select",
      options: ["2.5-inch", "M.2", "mSATA", "Add-in-Card"],
    },
  ],

  psu: [
    {
      key: "min_wattage",
      label: "Min power (W)",
      kind: "number",
      min: 1,
      max: 5000,
      placeholder: "For example 750",
    },
    {
      // Exact match: "SFX" does not also return "SFX-L".
      key: "form_factor",
      label: "Size",
      kind: "select",
      options: ["ATX", "SFX", "SFX-L", "TFX"],
    },
  ],

  pc_case: [
    {
      key: "form_factor",
      label: "Motherboard size",
      kind: "select",
      options: BOARD_SIZES,
    },
  ],

  cpu_cooler: [SOCKET_FILTER],
};
