import { Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Offer } from "@/lib/types";

type Props = {
  /** component.prices from the API: in stock first, then cheapest first. */
  offers: Offer[];
};

// "2026-09-21T01:41:54+00:00" -> "Sep 21, 2026". UTC, so the day never depends
// on the server time zone. (We never read the current time here: with
// cacheComponents turned on that can break the build.)
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function formatCheckedAt(iso: string | null): string | null {
  if (iso === null) return null;

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

// The link comes from the database. Only normal web links get a button, so a
// wrong value like "javascript:..." can never become a clickable link.
function safeBuyUrl(url: string | null): string | null {
  return url !== null && /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}

// The "Prices" part of a component page: one row per shop, with the Buy button.
// It is a Server Component, so the prices are in the HTML for search engines.
export function PriceOffers({ offers }: Props) {
  const hasAffiliate = offers.some((offer) => offer.is_affiliate);

  return (
    // scroll-mt-20: the sticky header (h-16) must not cover the heading when
    // someone jumps to #prices.
    <section
      id="prices"
      aria-labelledby="prices-heading"
      className="scroll-mt-20"
    >
      <h2 id="prices-heading" className="text-2xl font-semibold tracking-tight">
        Prices
      </h2>

      {offers.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          We have no prices for this part yet.
        </p>
      ) : (
        <>
          {/* The notice comes BEFORE the links, so the visitor reads it first. */}
          {hasAffiliate && (
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Some links below are affiliate links. We may earn a commission if
              you buy, at no extra cost to you.
            </p>
          )}

          <ul className="mt-4 divide-y rounded-xl border bg-card">
            {offers.map((offer, index) => (
              <li key={offer.id}>
                <OfferRow
                  offer={offer}
                  // The API puts the cheapest in-stock offer first. A single
                  // offer is not "the lowest" of anything.
                  isLowest={offers.length > 1 && index === 0 && offer.in_stock}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function OfferRow({ offer, isLowest }: { offer: Offer; isLowest: boolean }) {
  const shop = offer.retailer?.name ?? null;
  const buyUrl = safeBuyUrl(offer.buy_url);
  const checkedAt = formatCheckedAt(offer.checked_at);

  const stockLabel = offer.in_stock ? "In stock" : "Out of stock";
  const availability = offer.availability?.trim() ?? "";
  // Do not repeat "In stock" when the shop text says the same thing.
  const showAvailability =
    availability !== "" &&
    availability.toLowerCase() !== stockLabel.toLowerCase();

  // Only show the old price when it is really higher than the price now.
  const wasPrice =
    offer.original_price !== null && offer.original_price > offer.price
      ? formatMoney(offer.original_price, offer.currency)
      : null;

  const buttonLabel = shop ? `Buy at ${shop}` : "Buy now";

  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{shop ?? "Unknown shop"}</h3>

          {isLowest && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
              Lowest price
            </span>
          )}

          {offer.is_affiliate && (
            <span className="text-xs text-muted-foreground">
              Affiliate link
            </span>
          )}
        </div>

        <p
          className={cn(
            "mt-1 flex flex-wrap items-center gap-x-1.5 text-sm",
            offer.in_stock
              ? "text-green-700 dark:text-green-500"
              : "text-muted-foreground",
          )}
        >
          {offer.in_stock ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <X className="size-4" aria-hidden="true" />
          )}
          {stockLabel}
          {showAvailability && (
            <span className="text-muted-foreground">· {availability}</span>
          )}
        </p>

        {checkedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Price checked{" "}
            <time dateTime={offer.checked_at ?? undefined}>{checkedAt}</time>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p className="text-lg font-semibold">
          {wasPrice && (
            <>
              <span className="sr-only">Was </span>
              <s className="mr-2 text-sm font-normal text-muted-foreground">
                {wasPrice}
              </s>
              <span className="sr-only">Now </span>
            </>
          )}
          {formatMoney(offer.price, offer.currency)}
        </p>

        {buyUrl ? (
          // An affiliate link is "sponsored". A normal shop link is "nofollow".
          // Both open in a new tab, and "noopener" protects our page.
          <Button asChild variant={offer.in_stock ? "default" : "outline"}>
            <a
              href={buyUrl}
              target="_blank"
              rel={
                offer.is_affiliate ? "sponsored noopener" : "nofollow noopener"
              }
            >
              {buttonLabel}
              <ExternalLink aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">No link yet</span>
        )}
      </div>
    </div>
  );
}
