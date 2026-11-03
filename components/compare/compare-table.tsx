// components/compare/compare-table.tsx
// The comparison table: one column per part, one row per spec.
// A Server Component, so the specs are in the HTML.
//
// The box scrolls sideways on small screens and can get keyboard focus, so
// people without a mouse can scroll it. The first column stays in view.

/* eslint-disable @next/next/no-img-element --
   A plain <img> on purpose, same as the cards: we do not know the image
   domains yet. Later we can switch to next/image. */

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompareSection } from "@/lib/compare";
import { compareHref } from "@/lib/compare-url";
import { formatPrice } from "@/lib/format";
import type { Category } from "@/lib/site";
import type { ComponentDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  category: Category;
  components: ComponentDetail[];
  sections: CompareSection[];
};

export function CompareTable({ category, components, sections }: Props) {
  const slugs = components.map((component) => component.slug);

  return (
    <div
      role="region"
      aria-label={`${category.label} comparison`}
      tabIndex={0}
      className="overflow-x-auto rounded-xl border bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <caption className="sr-only">
          Specifications of the chosen {category.label}, side by side
        </caption>

        <thead>
          <tr className="border-b">
            <td className="sticky left-0 bg-card">
              <span className="sr-only">Specification</span>
            </td>

            {components.map((component) => (
              <PartHeader
                key={component.id}
                category={category}
                component={component}
                // The same page without this part.
                removeHref={compareHref(
                  category.segment,
                  slugs.filter((slug) => slug !== component.slug),
                )}
              />
            ))}
          </tr>
        </thead>

        {sections.map((section) => (
          <tbody key={section.key}>
            <tr>
              <th
                scope="rowgroup"
                colSpan={components.length + 1}
                className="bg-muted/40 px-4 py-2 text-left font-medium"
              >
                {section.title}
              </th>
            </tr>

            {section.rows.map((row) => (
              <tr key={row.key} className="border-t">
                <th
                  scope="row"
                  className="sticky left-0 w-36 min-w-32 bg-card px-4 py-2 text-left align-top font-normal text-muted-foreground"
                >
                  {row.label}
                </th>

                {row.cells.map((cell, index) => (
                  <td
                    key={components[index].id}
                    className={cn(
                      "px-4 py-2 align-top break-words",
                      !cell.known && "text-muted-foreground",
                    )}
                  >
                    {cell.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function PartHeader({
  category,
  component,
  removeHref,
}: {
  category: Category;
  component: ComponentDetail;
  removeHref: string;
}) {
  // Same link shape as the cards: /{segment}/{brand}/{slug}
  const href = component.manufacturer
    ? `/${category.segment}/${component.manufacturer.slug}/${component.slug}`
    : `/${category.segment}/${component.slug}`;

  const price = formatPrice(component.lowest_price);

  return (
    <th
      scope="col"
      className="w-56 min-w-44 px-4 py-4 text-left align-top font-normal"
    >
      <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-muted/40 p-2">
        {component.image ? (
          // alt="" because the name of the part is written below it.
          <img
            src={component.image}
            alt=""
            loading="lazy"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <category.icon
            className="size-8 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {component.manufacturer && (
        <p className="mt-3 text-xs text-muted-foreground">
          {component.manufacturer.name}
        </p>
      )}

      <Link href={href} className="font-medium leading-snug hover:underline">
        {component.name}
      </Link>

      <p className="mt-1 font-semibold">
        {price ?? (
          <span className="text-sm font-normal text-muted-foreground">
            No in-stock price
          </span>
        )}
      </p>

      <Button asChild variant="ghost" size="xs" className="mt-2">
        <Link
          href={removeHref}
          aria-label={`Remove ${component.name} from the comparison`}
        >
          <X />
          Remove
        </Link>
      </Button>
    </th>
  );
}
