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
