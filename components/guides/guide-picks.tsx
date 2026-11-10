// components/guides/guide-picks.tsx
// The "Our picks" block of a guide: for each pick, the label, the part, the
// explanation, the main specs, the live price and the Buy button.
// A Server Component, so everything is in the HTML for search engines.

import { Fragment } from "react";
import Link from "next/link";
import { PartThumb } from "@/components/builder/part-thumb";
import { BuyButton } from "@/components/catalog/buy-button";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney, formatSpecValue } from "@/lib/format";
import { LIST_SPECS } from "@/lib/list-specs";
import { CATEGORIES } from "@/lib/site";
import type { GuidePick } from "@/lib/types";

/** The anchor of this block. The table of contents of the page links to it. */
export const PICKS_ID = "guide-picks";

export function GuidePicks({ picks }: { picks: GuidePick[] }) {
  // A guide without picks shows no empty box.
  if (picks.length === 0) return null;

  const hasAffiliate = picks.some((pick) => pick.offer?.is_affiliate === true);

  return (
    // scroll-mt-20: the sticky header (h-16) must not cover the heading when
    // someone jumps to #guide-picks.
    <section
      id={PICKS_ID}
      aria-labelledby={`${PICKS_ID}-heading`}
      className="mt-10 scroll-mt-20"
    >
      <h2
        id={`${PICKS_ID}-heading`}
        className="text-2xl font-semibold tracking-tight"
      >
        Our picks
      </h2>

      {/* The notice comes BEFORE the links, so the visitor reads it first. */}
      {hasAffiliate && (
        <p className="mt-3 text-sm text-muted-foreground">
          Some links below are affiliate links. We may earn a commission if you
          buy, at no extra cost to you.
        </p>
      )}

      <ul className="mt-6 space-y-6">
        {picks.map((pick) => (
          // A part can only be picked once in a guide (Laravel checks this),
          // so type + id is unique.
          <li key={`${pick.type}-${pick.component.id}`}>
            <PickCard pick={pick} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PickCard({ pick }: { pick: GuidePick }) {
  const category = CATEGORIES.find((entry) => entry.type === pick.type);

  // A type we do not know (the API should never send one). Skip it quietly.
  if (!category) return null;

  const { component, offer } = pick;
  const shop = offer?.retailer?.name ?? null;
  const checkedAt = formatDate(offer?.checked_at);

  return (
    // A div, not an article: the whole guide is already an <article>.
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      {pick.label && (
        <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
          {pick.label}
        </span>
      )}

      <div className="mt-3 flex items-start gap-3">
        <PartThumb category={category} item={component} />

        <div className="min-w-0">
          {component.manufacturer && (
            <p className="text-xs text-muted-foreground">
              {component.manufacturer.name}
            </p>
          )}
          <h3 className="break-words text-lg font-semibold leading-snug">
            <Link href={pick.path} className="hover:underline">
              {component.name}
            </Link>
          </h3>
        </div>
      </div>

      {/* Plain text. React escapes it, and pre-line keeps a single line break. */}
      {pick.blurb.map((paragraph, index) => (
        <p
          key={index}
          className="mt-4 whitespace-pre-line break-words text-muted-foreground"
        >
          {paragraph}
        </p>
      ))}

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm sm:max-w-md">
        {LIST_SPECS[category.type].map((field) => (
          <Fragment key={field.key}>
            <dt className="text-muted-foreground">{field.label}</dt>
            <dd className="text-right">
              {formatSpecValue(component.specs[field.key], field)}
            </dd>
          </Fragment>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
        <div>
          {offer ? (
            <>
              <p className="text-2xl font-semibold">
                {formatMoney(offer.price, offer.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {shop
                  ? `Lowest in-stock price at ${shop}`
                  : "Lowest in-stock price"}
                {checkedAt && offer.checked_at && (
                  <>
                    {" "}
                    · checked{" "}
                    <time dateTime={offer.checked_at}>{checkedAt}</time>
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No in-stock price right now
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {offer && (
            <BuyButton
              url={offer.buy_url}
              isAffiliate={offer.is_affiliate}
              label={shop ? `Buy at ${shop}` : "Buy now"}
            />
          )}

          <Button asChild variant="outline">
            <Link href={pick.path}>
              Specs and prices
              {/* A page can have many of these links, so each needs its own name. */}
              <span className="sr-only"> for {component.name}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
