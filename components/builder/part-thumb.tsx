// components/builder/part-thumb.tsx
// The small square picture of a part. Without a picture, the icon of its category.

import { CatalogImage } from "@/components/catalog/catalog-image";
import type { PartItem } from "@/lib/builder";
import type { Category } from "@/lib/site";

type Props = {
  category: Category;
  item: PartItem;
};

export function PartThumb({ category, item }: Props) {
  return (
    // "relative": CatalogImage fills this box.
    <div className="relative flex size-12 shrink-0 items-center justify-center rounded-md bg-muted/40">
      {item.image ? (
        // alt="" because the name of the part is always written next to it.
        <CatalogImage
          src={item.image}
          alt=""
          sizes="48px"
          className="object-contain p-1"
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
