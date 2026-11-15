import Link from "next/link";
import { BUILDER_ENABLED, CATEGORIES, SITE_NAME } from "@/lib/site";

// Note: no "new Date().getFullYear()" here on purpose. With cacheComponents
// turned on, reading the current time in a Server Component can break the build.

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-semibold">{SITE_NAME}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Compare PC parts, check compatibility and track prices.
            </p>
          </div>

          <nav aria-label="Components">
            <h2 className="text-sm font-semibold">Components</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {CATEGORIES.map((category) => (
                <li key={category.type}>
                  <Link
                    href={`/${category.segment}`}
                    className="hover:text-foreground"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Explore">
            <h2 className="text-sm font-semibold">Explore</h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/guides" className="hover:text-foreground">
                  Buying guides
                </Link>
              </li>
              {/* Hidden until the /builder page exists (see BUILDER_ENABLED in lib/site.ts). */}
              {BUILDER_ENABLED && (
                <li>
                  <Link href="/builder" className="hover:text-foreground">
                    Build your PC
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold">Affiliate disclosure</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Some links on this site are affiliate links. We may earn a
              commission if you buy, at no extra cost to you.
            </p>
          </div>
        </div>

        <p className="mt-8 border-t pt-6 text-xs text-muted-foreground">
          © {SITE_NAME}. Prices and specs can change. Check the retailer before
          you buy.
        </p>
      </div>
    </footer>
  );
}
