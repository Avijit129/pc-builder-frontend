import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Next.js serves this file as /robots.txt.
//
// We allow everything on purpose. Pages that must not appear in Google get a
// "noindex" tag instead (for example shared builds). A page blocked here
// cannot be crawled, so Google would never see its noindex tag.
// Rules for filter, search and page URLs come in step D2.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
