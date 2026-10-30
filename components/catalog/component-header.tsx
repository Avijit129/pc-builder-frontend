import {
  ZoomGallery,
  type GalleryImage,
} from "@/components/catalog/zoom-gallery";
import { formatPrice } from "@/lib/format";
import type { ComponentDetail } from "@/lib/types";

type Props = {
  component: ComponentDetail;
};

// The pictures for the gallery: the primary image first, then the others in
// the order of the API (sort_order). Array.sort keeps the order of equal items.
function galleryImages(component: ComponentDetail): GalleryImage[] {
  const images = [...component.images]
    .filter((image) => image.url.trim() !== "")
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((image) => ({ url: image.url, alt: image.alt ?? component.name }));

  // Older data may only have the single "image" column.
  if (images.length === 0 && component.image) {
    return [{ url: component.image, alt: component.name }];
  }

  return images;
}

// The top part of a component page: the picture gallery with zoom on the left,
// the main facts on the right. Specs, prices and features come in the next
// steps (B2 and B3).
export function ComponentHeader({ component }: Props) {
  const price = formatPrice(component.lowest_price);

  // Show series and model only when they exist (unknown = leave it out).
  const subtitle = [component.series, component.model_number]
    .filter((value): value is string => Boolean(value))
    .join(" / ");

  return (
    <div className="mt-6">
      {/* The key makes the gallery start fresh (first picture) for each part. */}
      <ZoomGallery key={component.slug} images={galleryImages(component)}>
        <div>
          {component.manufacturer && (
            <p className="text-sm text-muted-foreground">
              {component.manufacturer.name}
            </p>
          )}

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {component.name}
          </h1>

          {subtitle !== "" && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}

          {component.description && (
            <p className="mt-4 text-muted-foreground">
              {component.description}
            </p>
          )}

          <div className="mt-6 rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Lowest in-stock price
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {price ?? (
                <span className="text-base font-normal text-muted-foreground">
                  No in-stock price
                </span>
              )}
            </p>
          </div>
        </div>
      </ZoomGallery>
    </div>
  );
}
