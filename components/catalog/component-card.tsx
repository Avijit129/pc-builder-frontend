import { Fragment } from "react";
import Link from "next/link";
import { formatPrice, formatSpecValue } from "@/lib/format";
import { LIST_SPECS } from "@/lib/list-specs";
import type { Category } from "@/lib/site";
import type { ListItem } from "@/lib/types";

type Props = {
  category: Category;
  item: ListItem<Record<string, unknown>>;
};

export function ComponentCard({ category, item }: Props) {
  // Page link: /{segment}/{manufacturer-slug}/{slug}.
  // If the manufacturer is null, leave out the brand part (API reference, section 3).
  const href = item.manufacturer
    ? `/${category.segment}/${item.manufacturer.slug}/${item.slug}`
    : `/${category.segment}/${item.slug}`;

  const price = formatPrice(item.lowest_price);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-muted/40 p-4">
        {item.image ? (
          // A plain <img> for now. We do not know the image domains yet.
          // Later we can switch to next/image (needs images.remotePatterns).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <category.icon
            className="size-10 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          {item.manufacturer && (
            <p className="text-xs text-muted-foreground">
              {item.manufacturer.name}
            </p>
          )}
          <h2 className="font-medium leading-snug">{item.name}</h2>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {LIST_SPECS[category.type].map((field) => (
            <Fragment key={field.key}>
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="text-right">
                {formatSpecValue(item.specs[field.key], field)}
              </dd>
            </Fragment>
          ))}
        </dl>

        <p className="mt-auto pt-2 font-semibold">
          {price ?? (
            <span className="text-sm font-normal text-muted-foreground">
              No in-stock price
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
