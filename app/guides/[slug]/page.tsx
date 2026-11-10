/* eslint-disable @next/next/no-img-element --
   A plain <img> on purpose, same as the cards: we do not know the image
   domains yet. Later we can switch to next/image. */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { JsonLd } from "@/components/catalog/json-ld";
import { apiGet } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getGuide } from "@/lib/get-guide";
import type { GuideListItem, Paginated } from "@/lib/types";
import { GuidePicks, PICKS_ID } from "@/components/guides/guide-picks";

type Props = {
  params: Promise<{ slug: string }>;
};

// With cacheComponents, Next.js wants to know at least one address at build
// time (same reason as app/builds/[slug]/page.tsx). We take the real guides
// from the API. If there are none yet, or Laravel is down, we use a placeholder
// that does not exist: Laravel answers 404 and the build makes a 404 page for
// it. Every other guide is rendered when someone opens it.
// (Laravel must be running when you run "npm run build".)
const PLACEHOLDER = [{ slug: "example-guide" }];

export async function generateStaticParams() {
  try {
    const result = await apiGet<Paginated<GuideListItem>>("/guides", {
      per_page: 50,
    });

    const params = result.data.map((guide) => ({ slug: guide.slug }));

    return params.length > 0 ? params : PLACEHOLDER;
  } catch {
    return PLACEHOLDER;
  }
}

// The tags in <head> come from the "seo" block of the API (section 5b), so
// Laravel decides the title, description and canonical URL.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);

  if (!guide) return {};

  const { seo } = guide;

  return {
    // "absolute" skips the " | PC Builder" suffix of the layout. The API title
    // is already made to fit in 60 characters.
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: seo.canonical_url },
    robots: { index: seo.robots.index, follow: seo.robots.follow },
    openGraph: {
      type: "article",
      siteName: seo.open_graph.site_name,
      url: seo.open_graph.url,
      title: seo.open_graph.title,
      description: seo.open_graph.description,
      images: seo.open_graph.image ? [seo.open_graph.image] : undefined,
      publishedTime: guide.published_at,
      modifiedTime: guide.updated_at ?? undefined,
    },
    twitter: {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: seo.twitter.image ? [seo.twitter.image] : undefined,
    },
  };
}

export default function GuideRoute(props: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* params is request data, so it needs Suspense. */}
      <Suspense fallback={<GuideSkeleton />}>
        <GuideContent {...props} />
      </Suspense>
    </div>
  );
}

async function GuideContent({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuide(slug);

  // A draft, a scheduled guide, an unknown slug and a strange slug all end here.
  if (!guide) notFound();

  const published = formatDate(guide.published_at);
  const updated = formatDate(guide.updated_at);
  // "Updated" on the same day as "Published" says nothing new.
  const showUpdated =
    updated !== null && updated !== published && guide.updated_at !== null;

  // The table of contents: the picks first (when there are any), then the sections.
  const tocItems = [
    ...(guide.picks.length > 0 ? [{ id: PICKS_ID, title: "Our picks" }] : []),
    ...guide.sections.map((section) => ({
      id: section.slug,
      title: section.heading,
    })),
  ];

  return (
    <>
      {/* One script tag per item: an Article and a BreadcrumbList. */}
      {guide.seo.structured_data.map((item, index) => (
        <JsonLd key={index} data={item} />
      ))}

      <Breadcrumbs items={guide.seo.breadcrumbs} />

      <article className="mt-4 max-w-3xl">
        <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
          {guide.title}
        </h1>

        {published && (
          <p className="mt-2 text-sm text-muted-foreground">
            Published <time dateTime={guide.published_at}>{published}</time>
            {showUpdated && guide.updated_at && (
              <>
                {" "}
                · Updated <time dateTime={guide.updated_at}>{updated}</time>
              </>
            )}
          </p>
        )}

        {guide.image && (
          // alt="" because the title is written right above the picture.
          <img
            src={guide.image}
            alt=""
            className="mt-6 aspect-[16/9] w-full rounded-xl border object-cover"
          />
        )}

        {/* The text is plain text. React escapes it, and pre-line keeps a
            single line break inside a paragraph. */}
        {guide.intro.map((paragraph, index) => (
          <p
            key={index}
            className="mt-4 whitespace-pre-line break-words text-lg text-muted-foreground"
          >
            {paragraph}
          </p>
        ))}

        {tocItems.length > 1 && (
          <nav
            aria-labelledby="toc-heading"
            className="mt-8 rounded-xl border bg-card p-4"
          >
            <h2 id="toc-heading" className="font-medium">
              In this guide
            </h2>
            <ul className="mt-3 space-y-1 text-sm">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <GuidePicks picks={guide.picks} />

        {guide.sections.map((section) => (
          // scroll-mt-20: the sticky header (h-16) must not cover the heading
          // when someone jumps to the anchor.
          <section
            key={section.slug}
            id={section.slug}
            aria-labelledby={`heading-${section.slug}`}
            className="mt-10 scroll-mt-20"
          >
            <h2
              id={`heading-${section.slug}`}
              className="break-words text-2xl font-semibold tracking-tight"
            >
              {section.heading}
            </h2>

            {section.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="mt-4 whitespace-pre-line break-words text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </>
  );
}

// Grey pulsing boxes while the guide loads.
function GuideSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="h-5 w-64 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-6 h-10 w-2/3 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-6 h-24 max-w-3xl animate-pulse rounded-md bg-muted/50" />
      <div className="mt-8 h-64 max-w-3xl animate-pulse rounded-xl border bg-muted/50" />
    </div>
  );
}
