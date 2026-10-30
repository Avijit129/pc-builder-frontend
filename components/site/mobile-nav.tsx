"use client";

// The menu button for small screens. It is a Client Component only because it
// needs state (open or closed). Everything else in the header stays on the server.

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="xl:hidden">
      <Button
        variant="outline"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
      </Button>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full border-b bg-background shadow-md"
        >
          <ul className="mx-auto grid max-w-7xl gap-1 p-4 sm:grid-cols-2 sm:px-6">
            {CATEGORIES.map((category) => (
              <li key={category.type}>
                <Link
                  href={`/${category.segment}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  <category.icon className="size-4" aria-hidden="true" />
                  {category.label}
                </Link>
              </li>
            ))}
            <li className="sm:col-span-2">
              <Link
                href="/builder"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                Start a build
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
