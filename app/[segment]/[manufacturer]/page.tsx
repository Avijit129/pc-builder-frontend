import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CategoryListing } from "@/components/catalog/category-listing";
import { JsonLd } from "@/components/catalog/json-ld";
import { ListSkeleton } from "@/components/catalog/list-skeleton";
import { getBrands } from "@/lib/get-brands";
import type { RawSearchParams } from "@/lib/list-params";
import {
  CATEGORIES,
  SITE_NAME,
  SITE_URL,
  getCategoryBySegment,
  type Category,
} from "@/lib/site";
import type { Brand, Seo } from "@/lib/types";

type Props = {
  params: Promise<{ segment: string; manufacturer: string }>;
  searchParams: Promise<RawSearchParams>;
};

// "/cpu/amd" -> "http://localhost:3000/cpu/amd" (the site URL from lib/site.ts).
function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

// The title and description are written here, in one place, so the <head>
// tags, the visible text and the JSON-LD always say the same thing.
function brandText(category: Category, brand: Brand) {
  return {
    title: `${brand.name} ${category.label}`,
    description: `Compare specs and prices of ${brand.name} ${category.label}, and check that they fit your build.`,
  };
}

// Tells Next.js the real brand pages (/cpu/amd, /gpu/asus ...) from the brand
// lists of Laravel. A brand that is added later is rendered when someone opens
// it. (Laravel must be running when you run "npm run build".)
export async function generateStaticParams() {
  const perCategory = await Promise.all(
    CATEGORIES.map(async (category) => {
      try {
        const brands = await getBrands(category);

        return brands.map((brand) => ({
          segment: category.segment,
          manufacturer: brand.slug,
        }));
      } catch {
        // One category failing must not stop the whole build.
        return [];
      }
    }),
  );

  return perCategory.flat();
}

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { segment, manufacturer } = await params;
  const category = getCategoryBySegment(segment);

  if (!category) return {};

  const brands = await getBrands(category);
  const brand = brands.find((item) => item.slug === manufacturer);

  if (!brand) return {};

  const { title, description } = brandText(category, brand);
  const path = `/${category.segment}/${brand.slug}`;

  return {
    // The layout adds " | PC Builder" to this title.
    title,
    description,
    // Always the plain brand address. Page 2 and filter URLs are handled in the
    // later SEO step (D2), together with the category pages.
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

export default function BrandPage(props: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Suspense fallback={<ListSkeleton />}>
        <BrandPageContent {...props} />
      </Suspense>
    </div>
  );
}

async function BrandPageContent({ params, searchParams }: Props) {
  const { segment, manufacturer } = await params;
  const category = getCategoryBySegment(segment);

  if (!category) notFound();

  // If this call fails it throws (error.tsx), it never becomes a 404.
  const brands = await getBrands(category);
  const brand = brands.find((item) => item.slug === manufacturer);

  if (!brand) {
    // /cpu/AMD -> /cpu/amd, so every brand page has exactly ONE URL.
    const sameBrand = brands.find(
      (item) => item.slug.toLowerCase() === manufacturer.toLowerCase(),
    );

    if (sameBrand) {
      permanentRedirect(`/${category.segment}/${sameBrand.slug}`);
    }

    // The brand has no active products in this category.
    notFound();
  }

  const { title, description } = brandText(category, brand);
  const categoryPath = `/${category.segment}`;
  const brandPath = `/${category.segment}/${brand.slug}`;

  // Used for the visible breadcrumbs AND the BreadcrumbList JSON-LD.
  const crumbs: Seo["breadcrumbs"] = [
    { name: "Home", path: "/", url: absoluteUrl("/") },
    {
      name: category.label,
      path: categoryPath,
      url: absoluteUrl(categoryPath),
    },
    { name: brand.name, path: brandPath, url: absoluteUrl(brandPath) },
  ];

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: absoluteUrl(brandPath),
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

  return (
    <>
      <JsonLd data={collectionPage} />
      <JsonLd data={breadcrumbList} />

      <Breadcrumbs items={crumbs} />

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>

      <div className="mt-6">
        <Suspense fallback={<ListSkeleton />}>
          <CategoryListing
            category={category}
            searchParams={searchParams}
            brand={brand}
          />
        </Suspense>
      </div>
    </>
  );
}
