// components/catalog/catalog-image.tsx
// The ONE image component for pictures that come from the database.
//
// It always uses "fill": the picture fills its parent box. So the parent MUST
// have position "relative" (class "relative") and a size (for example an
// aspect ratio, or size-12). Padding goes on the image: className="p-4".
//
// "sizes" is required. It tells the browser how wide the picture is shown at
// each screen width, so it can download a small file instead of a big one.
//
// A host that is not in image-hosts.json is NOT an error: the picture is shown
// without the optimizer (unoptimized), exactly like a plain <img>.

import Image from "next/image";
import type { Ref } from "react";
import { canOptimize } from "@/lib/images";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  /** Use "eager" for the biggest picture at the top of a page. */
  loading?: "lazy" | "eager";
  /** For code that needs the real <img> element (the zoom gallery reads its size). */
  ref?: Ref<HTMLImageElement>;
};

export function CatalogImage({
  src,
  alt,
  sizes,
  className,
  loading = "lazy",
  ref,
}: Props) {
  const address = src.trim();

  return (
    <Image
      ref={ref}
      src={address}
      alt={alt}
      fill
      sizes={sizes}
      loading={loading}
      unoptimized={!canOptimize(address)}
      className={className}
    />
  );
}
