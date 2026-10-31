// lib/format.ts
// Small helpers to show API values. Rule from the API: null means "unknown".
// We never show null as 0.

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** 399.99 -> "$399.99". Returns null when there is no price. */
export function formatPrice(value: number | null | undefined): string | null {
  return typeof value === "number" ? priceFormatter.format(value) : null;
}

/** "aio_liquid" -> "Aio liquid" */
export function humanize(text: string): string {
  const spaced = text.replace(/_/g, " ");

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

type FormatOptions = {
  /** Added after a number, for example " GHz". */
  suffix?: string;
  /** Turn snake_case text into normal words. */
  humanize?: boolean;
};

/** Any spec value -> text for the screen. */
export function formatSpecValue(
  value: unknown,
  options: FormatOptions = {},
): string {
  if (value === null || value === undefined || value === "") return "Unknown";

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Unknown";
  }

  if (typeof value === "number") return `${value}${options.suffix ?? ""}`;

  const text = String(value);

  return options.humanize ? humanize(text) : text;
}

/** 399.99 + "EUR" -> "€399.99". Falls back to plain text if the currency code is not valid. */
export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/** 28500 -> "28,500". */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

// UTC, so the day never depends on the server time zone.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

/** "2026-09-21" -> "Sep 21, 2026". Returns null when missing or not a date. */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}
