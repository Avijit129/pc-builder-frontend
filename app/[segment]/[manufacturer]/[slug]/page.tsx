import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ComponentHeader } from "@/components/catalog/component-header";
import { DetailSkeleton } from "@/components/catalog/detail-skeleton";
import { JsonLd } from "@/components/catalog/json-ld";
import { FeatureList } from "@/components/catalog/feature-list";
import { SpecTables } from "@/components/catalog/spec-tables";
import { apiGet } from "@/lib/api";
import { getComponent } from "@/lib/get-component";
import { CATEGORIES, getCategoryBySegment } from "@/lib/site";
import type { ListItem, Paginated } from "@/lib/types";

type Props = {
  params: Promise<{ segment: string; manufacturer: string; slug: string }>;
};

// With cacheComponents, Next.js wants to know at least some real addresses at
// build time. We take ONE real part of each category from the API. All other
// parts are rendered when someone opens them. (Laravel must be running when you
// run "npm run build".)
export async function generateStaticParams() {
  const perCategory = await Promise.all(
    CATEGORIES.map(async (category) => {
      try {
        const result = await apiGet<
          Paginated<ListItem<Record<string, unknown>>>
        >(category.apiPath, { per_page: 1 });

        return result.data.flatMap((item) =>
          item.manufacturer
            ? [
                {
                  segment: category.segment,
                  manufacturer: item.manufacturer.slug,
                  slug: item.slug,
                },
              ]
            : [],
        );
      } catch {
        // One category failing must not stop the whole build.
        return [];
      }
    }),
  );

  return perCategory.flat();
}

// The tags in <head> come from the "seo" block of the API, so Laravel decides
// the title, description and canonical URL (docs/frontend-api.md, section 4).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segment, slug } = await params;
  const category = getCategoryBySegment(segment);

  if (!category) return {};

  const component = await getComponent(category, slug);

  if (!component) return {};

  const { seo } = component;

  return {
    // "absolute" skips the " | PC Builder" suffix of the layout. The API title
    // is already made to fit in 60 characters.
    title: { absolute: seo.title },
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

export default function ComponentPage(props: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Suspense fallback={<DetailSkeleton />}>
        <ComponentPageContent {...props} />
      </Suspense>
    </div>
  );
}

async function ComponentPageContent({ params }: Props) {
  const { segment, manufacturer, slug } = await params;
  const category = getCategoryBySegment(segment);

  if (!category) notFound();

  const component = await getComponent(category, slug);

  // Unknown slug, inactive part, or a slug with strange characters.
  if (!component) notFound();

  // A part always has a brand in the database, so this is only a safety check.
  const brandSlug = component.manufacturer?.slug;

  if (!brandSlug) notFound();

  // Wrong brand in the URL (for example /cpu/intel/ryzen-7-7800x3d): send the
  // visitor to the real address, so every part has exactly ONE URL.
  if (brandSlug !== manufacturer) {
    permanentRedirect(`/${category.segment}/${brandSlug}/${component.slug}`);
  }

  return (
    <>
      {/* One script tag per item: a Product and a BreadcrumbList. */}
      {component.seo.structured_data.map((item, index) => (
        <JsonLd key={index} data={item} />
      ))}

      <Breadcrumbs items={component.seo.breadcrumbs} />

      <ComponentHeader component={component} />

      <div className="mt-12 space-y-12">
        <SpecTables specs={component.specs} />
        <FeatureList features={component.features} />
      </div>
    </>
  );
}
