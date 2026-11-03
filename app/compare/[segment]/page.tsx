import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddPart } from "@/components/compare/add-part";
import { CompareTable } from "@/components/compare/compare-table";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  buildCompareSections,
  onlyDifferences,
  parseCompareSlugs,
  parseDiffOnly,
} from "@/lib/compare";
import { compareHref } from "@/lib/compare-url";
import { getComponent } from "@/lib/get-component";
import type { RawSearchParams } from "@/lib/list-params";
import { CATEGORIES, SITE_URL, getCategoryBySegment } from "@/lib/site";
import type { ComponentDetail, Seo } from "@/lib/types";

type Props = {
  params: Promise<{ segment: string }>;
  searchParams: Promise<RawSearchParams>;
};

// Tells Next.js the 8 real segments (cpu, gpu, ...).
export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ segment: category.segment }));
}

// Every combination of parts is a different URL. They would be thin and
// duplicate pages, so a compare page is NOINDEX. "follow" stays true, so
// search engines still follow the links to the part pages.
// app/robots.ts allows crawling on purpose, so search engines can read the tag.
export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { segment } = await params;
  const category = getCategoryBySegment(segment);

  if (!category) return {};

  return {
    // The layout adds " | PC Builder" to this title.
    title: `Compare ${category.label}`,
    description: `Compare ${category.label} side by side: specs and prices.`,
    robots: { index: false, follow: true },
  };
}

// "/compare/cpu" -> "http://localhost:3000/compare/cpu"
function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export default function ComparePage(props: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* params and searchParams are request data, so they need Suspense. */}
      <Suspense fallback={<CompareSkeleton />}>
        <CompareContent {...props} />
      </Suspense>
    </div>
  );
}

async function CompareContent({ params, searchParams }: Props) {
  const { segment } = await params;
  const category = getCategoryBySegment(segment);

  if (!category) notFound();

  const rawParams = await searchParams;
  const slugs = parseCompareSlugs(rawParams);
  // ?diff=1 in the URL. The page keeps it in every link it writes.
  const diffOnly = parseDiffOnly(rawParams);

  // One call per part. They run at the same time, and every answer is cached.
  // getComponent returns null for an unknown slug and throws for other errors
  // (error.tsx shows them).
  const loaded = await Promise.all(
    slugs.map((slug) => getComponent(category, slug)),
  );

  const notFoundCount = loaded.filter((part) => part === null).length;

  // A part is shown once, even if the URL names it twice (for example with
  // other capital letters).
  const seen = new Set<number>();
  const components = loaded.filter((part): part is ComponentDetail => {
    if (part === null || seen.has(part.id)) return false;

    seen.add(part.id);

    return true;
  });

  // The slugs of the parts that are really on the page. Links use these, so a
  // slug that was not found never stays in the URL.
  const shownSlugs = components.map((component) => component.slug);

  // With fewer than 2 parts there is nothing to compare, so "differences
  // only" does nothing (and its switch is hidden).
  const filterRows = diffOnly && components.length > 1;

  const allSections = buildCompareSections(
    components.map((component) => component.specs),
  );
  const sections = filterRows ? onlyDifferences(allSections) : allSections;

  const crumbs: Seo["breadcrumbs"] = [
    { name: "Home", path: "/", url: absoluteUrl("/") },
    {
      name: category.label,
      path: `/${category.segment}`,
      url: absoluteUrl(`/${category.segment}`),
    },
    {
      name: "Compare",
      path: `/compare/${category.segment}`,
      url: absoluteUrl(`/compare/${category.segment}`),
    },
  ];

  return (
    <>
      <Breadcrumbs items={crumbs} />

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Compare {category.label}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Choose up to 4 parts to see their specs side by side.
      </p>

      {notFoundCount > 0 && (
        <p
          role="status"
          className="mt-4 max-w-2xl rounded-lg border border-amber-500/50 p-3 text-sm"
        >
          {notFoundCount} {notFoundCount === 1 ? "part" : "parts"} in the link
          could not be found and {notFoundCount === 1 ? "was" : "were"} left
          out.
        </p>
      )}

      <div className="mt-6">
        <AddPart
          segment={category.segment}
          slugs={shownSlugs}
          ids={components.map((component) => component.id)}
          // Open until there are 2 parts, so a visitor who comes from a part
          // page can choose the second part right away.
          startOpen={components.length < 2}
          diffOnly={diffOnly}
        />
      </div>

      {components.length === 1 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Add at least one more part to compare.
        </p>
      )}

      {components.length > 0 && (
        <div className="mt-6">
          {components.length > 1 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {filterRows
                  ? "Showing only the specs that are different."
                  : "Showing all specs."}
              </p>

              {/* A normal link: the URL is the state. scroll={false} keeps
                  the page where it is. */}
              <Button asChild variant="outline" size="sm">
                <Link
                  href={compareHref(category.segment, shownSlugs, {
                    diffOnly: !filterRows,
                  })}
                  scroll={false}
                >
                  {filterRows ? "Show all specs" : "Show differences only"}
                </Link>
              </Button>
            </div>
          )}

          <CompareTable
            category={category}
            components={components}
            sections={sections}
            diffOnly={diffOnly}
          />

          {filterRows && sections.length === 0 && (
            <p className="mt-3 rounded-lg border p-3 text-sm">
              These parts have the same value in every spec we show.
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Specs and prices can change. Check the shop before you buy.
          </p>
        </div>
      )}
    </>
  );
}

// Grey pulsing boxes while the parts load.
function CompareSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="h-5 w-64 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-6 h-10 w-72 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-6 h-20 animate-pulse rounded-xl border bg-muted/50" />
      <div className="mt-6 h-96 animate-pulse rounded-xl border bg-muted/50" />
    </div>
  );
}
