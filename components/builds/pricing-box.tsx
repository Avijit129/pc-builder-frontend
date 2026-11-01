// components/builds/pricing-box.tsx
// The price box of a shared build. "pricing" comes from the API (live prices).
// The text is made by describeEstimate, the same helper the builder uses, so
// both pages say the same thing.

import { describeEstimate } from "@/lib/builder";
import type { BuildPricing } from "@/lib/types";

export function PricingBox({ pricing }: { pricing: BuildPricing }) {
  const price = describeEstimate({
    total: pricing.total,
    pricedParts: pricing.priced_parts,
    unpricedParts: pricing.unpriced_parts,
  });

  const unpriced = pricing.unpriced_parts;

  return (
    <section
      aria-labelledby="pricing-heading"
      className="rounded-xl border bg-card p-4"
    >
      <h2 id="pricing-heading" className="font-medium">
        Price
      </h2>

      <p className="mt-3 text-2xl font-semibold">
        {price ?? (
          <span className="text-base font-normal text-muted-foreground">
            No prices yet
          </span>
        )}
      </p>

      <p className="mt-3 text-xs text-muted-foreground">
        The price adds the current lowest in-stock price of each part. Prices
        can change.
        {unpriced > 0 &&
          ` ${unpriced} ${unpriced === 1 ? "part has" : "parts have"} no in-stock price and ${
            unpriced === 1 ? "is" : "are"
          } not counted.`}
      </p>
    </section>
  );
}
