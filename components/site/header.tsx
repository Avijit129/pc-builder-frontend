import Link from "next/link";
import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/site/mobile-nav";
import { BUILDER_ENABLED, CATEGORIES, SITE_NAME } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Cpu className="size-5" aria-hidden="true" />
          <span>{SITE_NAME}</span>
        </Link>

        {/* Full menu only on wide screens. Smaller screens use MobileNav. */}
        <nav
          aria-label="Main"
          className="ml-4 hidden items-center gap-1 xl:flex"
        >
          {CATEGORIES.map((category) => (
            <Button key={category.type} asChild variant="ghost" size="sm">
              <Link href={`/${category.segment}`}>{category.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Hidden until the /builder page exists (see BUILDER_ENABLED in lib/site.ts). */}
          {BUILDER_ENABLED && (
            <div className="hidden sm:block">
              <Button asChild size="sm">
                <Link href="/builder">Start a build</Link>
              </Button>
            </div>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
