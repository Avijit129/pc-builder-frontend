// components/builds/build-parts.tsx
// The list of parts of a shared build. A Server Component, so the part names
// and links are in the HTML.
//
// Every part links to its own page (item.path), which also has the Buy buttons.

import Link from "next/link";
import { PartThumb } from "@/components/builder/part-thumb";
import { SLOTS } from "@/lib/builder";
import { formatPrice, formatSpecValue } from "@/lib/format";
import { LIST_SPECS } from "@/lib/list-specs";
import { CATEGORIES } from "@/lib/site";
import type { BuildItem } from "@/lib/types";

/** How many specs are written under the name of a part. */
const SPECS_SHOWN = 4;

export function BuildParts({ items }: { items: BuildItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        This build has no available parts.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {items.map((item) => (
        // A part can only be in a build once (Laravel checks this), so
        // type + id is unique.
        <li key={`${item.type}-${item.component.id}`}>
          <PartRow item={item} />
        </li>
      ))}
    </ul>
  );
}

function PartRow({ item }: { item: BuildItem }) {
  const category = CATEGORIES.find((entry) => entry.type === item.type);

  // A type we do not know (the API should never send one). Skip it quietly.
  if (!category) return null;

  const { component } = item;

  const live = formatPrice(component.lowest_price);
  const added = formatPrice(item.unit_price_snapshot);
  // Only mention the old price when it is different from the price now.
  const showAdded = added !== null && added !== live;

  const summary = LIST_SPECS[category.type]
    .slice(0, SPECS_SHOWN)
    .map(
      (field) =>
        `${field.label}: ${formatSpecValue(component.specs[field.key], field)}`,
    )
    .join(" · ");

  return (
    <div className="flex items-center gap-3 p-4">
      <PartThumb category={category} item={component} />

      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {SLOTS[item.type].title}
          {component.manufacturer && ` · ${component.manufacturer.name}`}
        </p>

        <Link
          href={item.path}
          className="font-medium leading-snug hover:underline"
        >
          {component.name}
        </Link>

        <p className="mt-0.5 text-xs text-muted-foreground">{summary}</p>

        {/* The note is written by the owner of the build. React escapes it. */}
        {item.notes && (
          <p className="mt-1 break-words text-sm">Note: {item.notes}</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold">
          {live ?? (
            <span className="font-normal text-muted-foreground">
              No in-stock price
            </span>
          )}
          {live && item.quantity > 1 && (
            <span className="font-normal text-muted-foreground"> each</span>
          )}
        </p>

        {item.quantity > 1 && (
          <p className="text-xs text-muted-foreground">
            Quantity: {item.quantity}
          </p>
        )}

        {showAdded && (
          <p className="text-xs text-muted-foreground">
            Price when added: {added}
          </p>
        )}
      </div>
    </div>
  );
}
