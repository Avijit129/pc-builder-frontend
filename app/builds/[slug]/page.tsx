import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuildParts } from "@/components/builds/build-parts";
import { PricingBox } from "@/components/builds/pricing-box";
import { CompatibilityResultView } from "@/components/builder/compatibility-result";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Button } from "@/components/ui/button";
import type { BuilderPart } from "@/lib/builder";
import { formatDate } from "@/lib/format";
import { getBuild } from "@/lib/get-build";
import { BUILDER_ENABLED } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

// With cacheComponents, Next.js wants to know at least one address at build
// time (same reason as the component page). Shared builds are user content, so
// there is no real slug to list. This placeholder does not exist: Laravel
// answers 404 and the build creates a 404 page for it. Every real build is
// rendered when someone opens it.
export function generateStaticParams() {
  return [{ slug: "example-build" }];
}

// The tags in <head> come from the "seo" block of the API (section 7). Laravel
// sends robots.index = false, so a shared build is NOINDEX. app/robots.ts
// allows crawling on purpose, so search engines can read that tag.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const build = await getBuild(slug);

  if (!build) return {};

  const { seo } = build;

  return {
    // The layout adds " | PC Builder" to this title.
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical_url },
    robots: { index: seo.robots.index, follow: seo.robots.follow },
    openGraph: {
      type: "website",
      siteName: seo.open_graph.site_name,
      url: seo.open_graph.url,
      title: seo.open_graph.title,
      description: seo.open_graph.description,
      images: seo.open_graph.image ? [seo.open_graph.image] : undefined,
    },
    twitter: {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: seo.twitter.image ? [seo.twitter.image] : undefined,
    },
  };
}

export default function SharedBuildRoute(props: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Suspense fallback={<BuildSkeleton />}>
        <SharedBuildContent {...props} />
      </Suspense>
    </div>
  );
}

async function SharedBuildContent({ params }: Props) {
  const { slug } = await params;
  const build = await getBuild(slug);

  // A private build, an unknown slug and a strange slug all end here.
  if (!build) notFound();

  // Same fallback name as the seo block of the API.
  const name = build.name?.trim() || "Custom PC Build";
  const updated = formatDate(build.updated_at);

  // The result view writes the name of a RAM kit or SSD in front of its
  // checks. It looks the part up in this list.
  const parts: BuilderPart[] = build.items.map((item) => ({
    type: item.type,
    item: item.component,
    quantity: item.quantity,
  }));

  return (
    <>
      <Breadcrumbs items={build.seo.breadcrumbs} />

      <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight">
        {name}
      </h1>

      {build.description && (
        <p className="mt-2 max-w-2xl whitespace-pre-line break-words text-muted-foreground">
          {build.description}
        </p>
      )}

      {updated && build.updated_at && (
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated <time dateTime={build.updated_at}>{updated}</time>
        </p>
      )}

      {build.unavailable_parts > 0 && (
        <p className="mt-4 max-w-2xl rounded-lg border border-amber-500/50 p-3 text-sm">
          {build.unavailable_parts}{" "}
          {build.unavailable_parts === 1 ? "saved part is" : "saved parts are"}{" "}
          no longer available.{" "}
          {build.unavailable_parts === 1 ? "It is" : "They are"} not shown, and
          not counted in the price or the compatibility check.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section aria-labelledby="parts-heading">
          <h2
            id="parts-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Parts
          </h2>

          <div className="mt-4">
            <BuildParts items={build.items} />
          </div>

          {BUILDER_ENABLED && (
            <Button asChild variant="outline" className="mt-6">
              <Link href="/builder">Build your own PC</Link>
            </Button>
          )}
        </section>

        {/* Sticky on wide screens, like the builder page. */}
        <aside
          aria-label="Price and compatibility"
          className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:p-1"
        >
          <PricingBox pricing={build.pricing} />

          <section
            aria-labelledby="compat-heading"
            className="rounded-xl border bg-card p-4"
          >
            <h2 id="compat-heading" className="font-medium">
              Compatibility
            </h2>

            <CompatibilityResultView
              result={build.compatibility}
              parts={parts}
            />

            <p className="mt-4 text-xs text-muted-foreground">
              Checks use the specs in our database. Please confirm on the
              maker&apos;s page before you buy.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}

// Grey pulsing boxes shown while the build loads.
function BuildSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="h-5 w-48 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-6 h-10 w-2/3 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-96 animate-pulse rounded-xl border bg-muted/50" />
        <div className="h-64 animate-pulse rounded-xl border bg-muted/50" />
      </div>
    </div>
  );
}
