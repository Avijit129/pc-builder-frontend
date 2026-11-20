// lib/images.ts
// Decides if an image address may go through the Next.js image optimizer.
// The allowed hosts are in image-hosts.json (next.config.ts reads the same file).
// No server code here, so Client Components can import it too.

import imageHosts from "@/image-hosts.json";

const ALLOWED_HOSTS: readonly string[] = imageHosts;

/**
 * true only for an https address of a listed host (and no special port).
 * Everything else (a relative path, http, another host) returns false, and
 * the image is then shown without the optimizer, like a plain <img>.
 */
export function canOptimize(src: string): boolean {
  let url: URL;

  try {
    url = new URL(src);
  } catch {
    return false;
  }

  return (
    url.protocol === "https:" &&
    url.port === "" &&
    ALLOWED_HOSTS.includes(url.hostname)
  );
}
