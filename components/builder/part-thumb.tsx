// components/builder/part-thumb.tsx
// The small square picture of a part. Without a picture, the icon of its category.

/* eslint-disable @next/next/no-img-element --
   A plain <img> on purpose, same as the cards: we do not know the image
   domains yet. Later we can switch to next/image. */

import type { PartItem } from "@/lib/builder";
import type { Category } from "@/lib/site";

type Props = {
  category: Category;
  item: PartItem;
};

export function PartThumb({ category, item }: Props) {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted/40 p-1">
      {item.image ? (
        // alt="" because the name of the part is always written next to it.
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <category.icon
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
