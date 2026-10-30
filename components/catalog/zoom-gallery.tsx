"use client";

// components/catalog/zoom-gallery.tsx
// The picture area of a component page: one big picture, small thumbnails,
// and a hover zoom (a lens on the picture + a big zoom window on the right).
//
// This is a Client Component only because it needs mouse events and state.
// The content on the right (name, price, ...) is passed in as "children", so
// it is still rendered on the SERVER and stays in the HTML for search engines.
//
// The idea comes from SingleProduct.jsx: the lens follows the mouse, and the
// zoom window shows the same picture bigger, moved to the lens position.

/* eslint-disable @next/next/no-img-element --
   A plain <img> on purpose, same as the cards: we do not know the image
   domains yet. Later we can switch to next/image. */

import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  url: string;
  alt: string;
};

type Props = {
  images: GalleryImage[];
  /** The content on the right side (name, price, ...). Rendered on the server. */
  children: ReactNode;
};

/** The zoom window shows the picture this many times bigger than on the page. */
const ZOOM = 3;

/**
 * Width divided by height. The picture box AND the zoom window use the same
 * shape, so the zoomed picture is never stretched.
 */
const ASPECT_RATIO = 4 / 3;

/**
 * Zoom works from this width up (the "md" size of Tailwind). Below it the
 * picture and the text are stacked, so there is no space for a zoom window.
 */
const ZOOM_MEDIA_QUERY = "(min-width: 768px)";

type ZoomState = {
  /** The lens on the small picture, in pixels inside the picture box. */
  lens: { left: number; top: number; width: number; height: number };
  /** The big picture inside the zoom window (CSS values). */
  backgroundSize: string;
  backgroundPosition: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function ZoomGallery({ images, children }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  // null = the mouse is not on the picture, so no lens and no zoom window.
  const [zoom, setZoom] = useState<ZoomState | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const asideRef = useRef<HTMLDivElement>(null);

  // Stay safe if the list of images gets shorter.
  const currentIndex = Math.min(activeIndex, images.length - 1);
  const current: GalleryImage | undefined = images[currentIndex];

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const box = boxRef.current;
    const image = imageRef.current;
    const aside = asideRef.current;

    if (!box || !image || !aside) return;

    // A finger scrolls the page, so only a mouse zooms. And only on wide
    // screens, where the text is beside the picture.
    if (
      event.pointerType !== "mouse" ||
      !window.matchMedia(ZOOM_MEDIA_QUERY).matches
    ) {
      return;
    }

    // Not loaded yet: we do not know its real size.
    if (image.naturalWidth === 0 || image.naturalHeight === 0) return;

    // 1. Where is the picture inside the box? The picture is shown with
    //    "object-contain", which can leave empty space at the sides or at the
    //    top and bottom. The lens must stay on the real picture.
    const boxWidth = box.clientWidth;
    const boxHeight = box.clientHeight;
    const fit = Math.min(
      boxWidth / image.naturalWidth,
      boxHeight / image.naturalHeight,
    );
    const imageWidth = image.naturalWidth * fit;
    const imageHeight = image.naturalHeight * fit;
    const imageLeft = (boxWidth - imageWidth) / 2;
    const imageTop = (boxHeight - imageHeight) / 2;

    // 2. The zoom window is as wide as the right side and has the same shape
    //    as the picture box. The lens is the part of the picture that fills
    //    the window after the zoom, so it is the window size divided by ZOOM.
    const paneWidth = aside.getBoundingClientRect().width;
    const paneHeight = paneWidth / ASPECT_RATIO;

    if (paneWidth === 0) return;

    let lensWidth = paneWidth / ZOOM;
    let lensHeight = paneHeight / ZOOM;

    // A lens bigger than the picture makes no sense. Make both sides smaller
    // by the same amount, so the lens keeps the shape of the window.
    const shrink = Math.min(
      1,
      imageWidth / lensWidth,
      imageHeight / lensHeight,
    );
    lensWidth *= shrink;
    lensHeight *= shrink;

    // 3. The lens is centered on the mouse and kept inside the picture.
    const boxRect = box.getBoundingClientRect();
    const mouseX = event.clientX - boxRect.left - box.clientLeft - imageLeft;
    const mouseY = event.clientY - boxRect.top - box.clientTop - imageTop;

    const lensLeft = clamp(mouseX - lensWidth / 2, 0, imageWidth - lensWidth);
    const lensTop = clamp(mouseY - lensHeight / 2, 0, imageHeight - lensHeight);

    // 4. The big picture in the zoom window: the whole picture, scaled up, and
    //    moved so that the lens area is exactly what you see.
    const scale = paneWidth / lensWidth;

    setZoom({
      lens: {
        left: imageLeft + lensLeft,
        top: imageTop + lensTop,
        width: lensWidth,
        height: lensHeight,
      },
      backgroundSize: `${imageWidth * scale}px ${imageHeight * scale}px`,
      backgroundPosition: `${-lensLeft * scale}px ${-lensTop * scale}px`,
    });
  }

  return (
    <section className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* Left: the picture and the thumbnails */}
      <div className="min-w-0">
        <div
          ref={boxRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setZoom(null)}
          style={{ aspectRatio: ASPECT_RATIO }}
          className={cn(
            "relative overflow-hidden rounded-xl border bg-muted/40",
            current && "md:cursor-crosshair",
          )}
        >
          {current ? (
            <>
              <img
                ref={imageRef}
                src={current.url}
                alt={current.alt}
                draggable={false}
                className="absolute inset-0 size-full object-contain"
              />

              {zoom && (
                // pointer-events-none: the lens must never catch the mouse,
                // or the zoom would flicker on and off.
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute border border-foreground/40 bg-background/30"
                  style={{
                    left: zoom.lens.left,
                    top: zoom.lens.top,
                    width: zoom.lens.width,
                    height: zoom.lens.height,
                  }}
                />
              )}
            </>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image yet
            </p>
          )}
        </div>

        {images.length > 1 && (
          <ul
            aria-label="Product images"
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
          >
            {images.map((image, index) => (
              <li key={`${index}-${image.url}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show image ${index + 1} of ${images.length}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                  className={cn(
                    "flex size-16 items-center justify-center rounded-md border bg-muted/40 p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    index === currentIndex
                      ? "border-primary"
                      : "hover:border-ring",
                  )}
                >
                  <img
                    src={image.url}
                    alt=""
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right: the normal content. The zoom window is drawn ON TOP of it
          while the mouse is on the picture, so nothing moves on the page. */}
      <div ref={asideRef} className="relative min-w-0">
        {children}

        {zoom && current && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-10 w-full rounded-xl bg-background bg-no-repeat shadow-lg ring-1 ring-border"
            style={{
              aspectRatio: ASPECT_RATIO,
              // JSON.stringify adds quotes, so a strange URL cannot break the CSS.
              backgroundImage: `url(${JSON.stringify(current.url)})`,
              backgroundSize: zoom.backgroundSize,
              backgroundPosition: zoom.backgroundPosition,
            }}
          />
        )}
      </div>
    </section>
  );
}
