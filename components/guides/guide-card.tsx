// components/guides/guide-card.tsx
// One guide on the /guides list page. A Server Component.

/* eslint-disable @next/next/no-img-element --
   A plain <img> on purpose, same as the other cards: we do not know the image
   domains yet. Later we can switch to next/image. */

import Link from "next/link";
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
        <div className="aspect-[16/9] bg-muted/40">
          {/* alt="" because the title is written right below the picture. */}
          <img
            src={guide.image}
            alt=""
            loading="lazy"
            className="size-full object-cover"
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
