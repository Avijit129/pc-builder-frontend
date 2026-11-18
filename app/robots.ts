import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Next.js serves this file as /robots.txt. It is made at BUILD time, so
// BLOCK_INDEXING must be set before "npm run build".
//
// We allow everything on purpose. Pages that must not appear in Google get a
// "noindex" tag instead (for example shared builds). A page blocked here
// cannot be crawled, so Google would never see its noindex tag.
// Rules for filter, search and page URLs come in step D2 of the SEO plan.
//
// On a test or staging server (BLOCK_INDEXING=true) the noindex is the
// X-Robots-Tag header from next.config.ts. Here we only stop advertising the
// sitemap, and we still do NOT block crawling, for the same reason as above.
export default function robots(): MetadataRoute.Robots {
  if (process.env.BLOCK_INDEXING === "true") {
    return { rules: { userAgent: "*", allow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
