// components/guides/latest-guides.tsx
// The "Latest guides" block of the homepage. A Server Component.
//
// It draws NOTHING when there are no guides, or when Laravel cannot answer.
// So the homepage never shows an empty box, never links to an empty page, and
// still works when Laravel is down (the page wraps this in <Suspense>).

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideCard } from "@/components/guides/guide-card";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { GuideListItem, Paginated } from "@/lib/types";

/** How many guides the homepage shows. The API allows 1 to 50. */
const COUNT = 3;

export async function LatestGuides() {
  let guides: GuideListItem[];

  try {
    const result = await apiGet<Paginated<GuideListItem>>("/guides", {
      per_page: COUNT,
    });

    guides = result.data;
  } catch (error) {
    // The homepage is more important than this block, so we do not crash it.
    console.error("The latest guides could not be loaded:", error);

    return null;
  }

  if (guides.length === 0) return null;

  return (
    <section
      aria-labelledby="latest-guides-heading"
      className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="latest-guides-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          Latest guides
        </h2>

        <Button asChild variant="outline" size="sm">
          <Link href="/guides">
            All guides
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <GuideCard guide={guide} as="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
