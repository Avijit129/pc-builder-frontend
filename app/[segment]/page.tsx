import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryListing } from "@/components/catalog/category-listing";
import { ListSkeleton } from "@/components/catalog/list-skeleton";
import {
  canonicalListPath,
  pageTitleSuffix,
  parseListParams,
  type RawSearchParams,
} from "@/lib/list-params";
import { CATEGORIES, getCategoryBySegment } from "@/lib/site";

import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareHref } from "@/lib/compare-url";

type Props = {
  params: Promise<{ segment: string }>;
  searchParams: Promise<RawSearchParams>;
};

// Tells Next.js the 8 real segments (cpu, gpu, ...). Any other word, for
// example /foo, ends in notFound() below.
export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ segment: category.segment }));
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { segment } = await params;
  const category = getCategoryBySegment(segment);

  if (!category) return {};

  // The same cleaning as the list itself, so the tags always match the page.
  const listParams = parseListParams(await searchParams, category.type);

  return {
    // The layout adds " | PC Builder" to this title.
    title: `${category.label}${pageTitleSuffix(listParams)}`,
    description: `Browse and compare ${category.label}: specs, prices and compatibility.`,
    // /cpu, or /cpu?page=2 for a plain page 2 (see lib/list-params.ts).
    alternates: { canonical: canonicalListPath(category.segment, listParams) },
  };
}

export default function CategoryPage(props: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Suspense fallback={<ListSkeleton />}>
        <CategoryPageContent {...props} />
      </Suspense>
    </div>
  );
}

async function CategoryPageContent({ params, searchParams }: Props) {
  const { segment } = await params;
  const category = getCategoryBySegment(segment);

  if (!category) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {category.label}
          </li>
        </ol>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {category.label}
      </h1>
      <p className="mt-2 text-muted-foreground">{category.description}</p>

      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link href={compareHref(category.segment, [])}>
          <Scale />
          Compare {category.label}
        </Link>
      </Button>

      <div className="mt-6">
        <Suspense fallback={<ListSkeleton />}>
          <CategoryListing category={category} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
