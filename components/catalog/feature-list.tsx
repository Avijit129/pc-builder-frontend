import { Check, X } from "lucide-react";
import type { ComponentFeature } from "@/lib/types";

type Props = {
  /** component.features from the API. */
  features: ComponentFeature[];
};

// The "Features" part of a component page, for example "Overclocking" or
// "Hardware ray tracing". is_supported can be false, and that is useful to
// know too, so those features stay in the list with a different icon.
// Nothing is drawn when there are no features, so the page has no empty box.
export function FeatureList({ features }: Props) {
  if (features.length === 0) return null;

  return (
    <section aria-labelledby="features-heading">
      <h2
        id="features-heading"
        className="text-2xl font-semibold tracking-tight"
      >
        Features
      </h2>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li
            key={feature.slug}
            className="flex gap-3 rounded-xl border bg-card p-4"
          >
            {feature.is_supported ? (
              <Check
                className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-500"
                aria-hidden="true"
              />
            ) : (
              <X
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}

            <div>
              <p
                className={
                  feature.is_supported
                    ? "font-medium"
                    : "font-medium text-muted-foreground"
                }
              >
                {/* The icon is hidden from screen readers, so say it in text. */}
                <span className="sr-only">
                  {feature.is_supported ? "Supported: " : "Not supported: "}
                </span>
                {feature.name}
              </p>

              {feature.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
