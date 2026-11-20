// components/guides/guide-card.tsx
// One guide on the /guides list page. A Server Component.

import Link from "next/link";
import { CatalogImage } from "@/components/catalog/catalog-image";
import { formatDate } from "@/lib/format";
import type { GuideListItem } from "@/lib/types";

export function GuideCard({
  guide,
  as: Heading = "h2",
}: {
  guide: GuideListItem;
  /** Use "h3" when the card sits under an h2 (for example on the homepage). */
  as?: "h2" | "h3";
}) {
  const published = formatDate(guide.published_at);

  return (
    <Link
      href={guide.path}
      className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {guide.image && (
        // "relative": CatalogImage fills this box.
        <div className="relative aspect-[16/9] bg-muted/40">
          {/* alt="" because the title is written right below the picture. */}
          <CatalogImage
            src={guide.image}
            alt=""
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Heading className="font-medium leading-snug">{guide.title}</Heading>

        {guide.excerpt && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {guide.excerpt}
          </p>
        )}

        {published && (
          <p className="mt-auto pt-2 text-xs text-muted-foreground">
            <time dateTime={guide.published_at}>{published}</time>
          </p>
        )}
      </div>
    </Link>
  );
}
