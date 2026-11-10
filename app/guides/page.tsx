import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { JsonLd } from "@/components/catalog/json-ld";
import { Pagination } from "@/components/catalog/pagination";
import { Button } from "@/components/ui/button";
import { GuideCard } from "@/components/guides/guide-card";
import { apiGet } from "@/lib/api";
import {
  DEFAULT_SORT,
  parsePage,
  type ListParams,
  type RawSearchParams,
} from "@/lib/list-params";
import { SITE_URL } from "@/lib/site";
import type { GuideListItem, Paginated, Seo } from "@/lib/types";

type Props = {
  searchParams: Promise<RawSearchParams>;
};

/** Guides per page. The API allows 1 to 50. */
const PER_PAGE = 12;

// The layout adds " | PC Builder" to this title. The canonical address is
// always the plain list. Self-canonical for ?page=2 is an optional later step.
export const metadata: Metadata = {
  title: "Buying guides",
  description:
    "PC buying guides with our picks for each part, and the current prices.",
  alternates: { canonical: "/guides" },
};

// The Pagination component was made for the list pages and needs a ListParams
// object. This page has no search or filters, so we pass an empty one.
const NO_FILTERS: ListParams = {
  search: "",
  sort: DEFAULT_SORT,
  page: 1,
  manufacturer: "",
  filters: {},
};

// "/guides" -> "http://localhost:3000/guides" (the site URL from lib/site.ts).
function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

const crumbs: Seo["breadcrumbs"] = [
  { name: "Home", path: "/", url: absoluteUrl("/") },
  { name: "Guides", path: "/guides", url: absoluteUrl("/guides") },
];

const collectionPage = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Buying guides",
  url: absoluteUrl("/guides"),
};

const breadcrumbList = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: crumb.url,
  })),
};

export default function GuidesPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd data={collectionPage} />
      <JsonLd data={breadcrumbList} />

      <Breadcrumbs items={crumbs} />

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Buying guides
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Our picks for each part, with the current prices.
      </p>

      <div className="mt-8">
        {/* searchParams is request data, so it needs Suspense. */}
        <Suspense fallback={<GuidesSkeleton />}>
          <GuidesContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function GuidesContent({ searchParams }: Props) {
  const page = parsePage(await searchParams);

  // If Laravel is down or answers with an error, this throws and the
  // error.tsx file next to the page shows the error screen.
  const result = await apiGet<Paginated<GuideListItem>>("/guides", {
    page,
    per_page: PER_PAGE,
  });

  const { total, current_page, last_page } = result.meta;

  // Page 99 of 2 would be a thin duplicate page. Go to the last real page.
  // redirect() throws on purpose, so it is never inside try/catch.
  if (current_page > last_page) {
    redirect(last_page > 1 ? `/guides?page=${last_page}` : "/guides");
  }

  if (result.data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">No guides yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We are writing them. In the meantime, browse the parts.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/cpu">Browse CPUs</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "guide" : "guides"}
      </p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((guide) => (
          <li key={guide.slug}>
            <GuideCard guide={guide} />
          </li>
        ))}
      </ul>

      <Pagination
        segment="guides"
        params={NO_FILTERS}
        currentPage={current_page}
        lastPage={last_page}
      />
    </>
  );
}

// Grey pulsing boxes while the list loads.
function GuidesSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-xl border bg-muted/50"
          />
        ))}
      </div>
    </div>
  );
}
