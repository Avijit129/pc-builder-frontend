import Link from "next/link";
import type { Category } from "@/lib/site";
import type { Brand } from "@/lib/types";

type Props = {
  category: Category;
  brands: Brand[];
  /** On a brand page: the brand we are on. It is left out of the list. */
  currentSlug?: string;
};

// Plain links to the brand pages (/cpu/amd, /cpu/intel, ...).
// The brand <select> in the toolbar is a form, which search engines do not
// follow. These links are how a crawler finds the brand pages from the list
// pages, and how it finds the other brands from a brand page.
export function BrandLinks({ category, brands, currentSlug }: Props) {
  const links = brands.filter((brand) => brand.slug !== currentSlug);

  // Nothing to link to (for example a category with only one brand).
  if (links.length === 0) return null;

  return (
    <nav aria-labelledby="brand-links-heading" className="mt-12 border-t pt-8">
      <h2
        id="brand-links-heading"
        className="text-lg font-semibold tracking-tight"
      >
        {currentSlug
          ? `More ${category.label} brands`
          : `${category.label} by brand`}
      </h2>

      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map((brand) => (
          <li key={brand.slug}>
            <Link
              href={`/${category.segment}/${brand.slug}`}
              className="inline-flex rounded-md border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {brand.name} ({brand.products_count})
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
