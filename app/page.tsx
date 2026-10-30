import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ListChecks, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/site";

// The title comes from the layout. Here we only set the canonical URL.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    title: "Compatibility checks",
    description:
      "See if your CPU, motherboard, RAM, case and power supply work together before you buy.",
    icon: ShieldCheck,
  },
  {
    title: "Price tracking",
    description:
      "Compare prices from different shops and see which parts are in stock.",
    icon: Tag,
  },
  {
    title: "Detailed specs",
    description:
      "Clear spec tables for every part, so you can compare with confidence.",
    icon: ListChecks,
  },
];

export default function Home() {
  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Build your PC with confidence
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse parts, compare specs and prices, and check that everything
              fits together before you buy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/builder">
                  Start a build
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/cpu">Browse CPUs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Browse by category
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <li key={category.type}>
              <Link
                href={`/${category.segment}`}
                className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <category.icon
                  className="size-6 text-muted-foreground transition-colors group-hover:text-foreground"
                  aria-hidden="true"
                />
                <h3 className="font-medium">{category.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Why use this site
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex flex-col gap-2">
                <feature.icon className="size-6" aria-hidden="true" />
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
