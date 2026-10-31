import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";
import { SITE_URL } from "@/lib/site";
import type { ApiData, SitemapEntry } from "@/lib/types";

// Next.js serves this file as /sitemap.xml.
//
// Laravel knows which pages exist and which are indexable:
//   GET /api/sitemap/listings    category and brand pages
//   GET /api/sitemap/components  product pages (inactive and noindex parts are left out)
// Laravel does not list the homepage, so we add it here.
// Shared builds are never listed (they are noindex).

// Google accepts at most 50,000 URLs in ONE sitemap file.
// When we get close to this, we split the sitemap (generateSitemaps).
const MAX_URLS = 50_000;

type Item = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<Item["changeFrequency"]>;

const CHANGE_FREQUENCIES: readonly ChangeFrequency[] = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
];

// Laravel sends a plain string. Only a value Next.js accepts goes through.
function toChangeFrequency(value: string | null): ChangeFrequency | undefined {
  return CHANGE_FREQUENCIES.find((item) => item === value);
}

// "/cpu/amd" -> "http://localhost:3000/cpu/amd"
function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

// Laravel builds its "url" from FRONTEND_URL. The canonical tag of every
// product page comes from the same setting. If it is not the address of this
// site (for example it is still localhost in production), all canonical tags
// point to the wrong place. This warning makes that mistake easy to see.
function warnIfWrongHost(entries: SitemapEntry[]) {
  const siteOrigin = new URL(SITE_URL).origin;

  const wrong = entries.filter((entry) => {
    try {
      return new URL(entry.url).origin !== siteOrigin;
    } catch {
      return true;
    }
  });

  if (wrong.length > 0) {
    console.warn(
      `[sitemap] ${wrong.length} of ${entries.length} URLs from Laravel do not start with ${siteOrigin} ` +
        `(for example ${wrong[0].url}). Check FRONTEND_URL in the Laravel .env file.`,
    );
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // If Laravel is down this throws. That is on purpose: a failed sitemap is
  // better than a sitemap with only the homepage, which would tell Google that
  // all other pages are gone.
  const [listings, components] = await Promise.all([
    apiGet<ApiData<SitemapEntry[]>>("/sitemap/listings"),
    apiGet<ApiData<SitemapEntry[]>>("/sitemap/components"),
  ]);

  const fromLaravel = [...listings.data, ...components.data];

  warnIfWrongHost(fromLaravel);

  // A Map with the URL as key: the same URL can never be listed twice.
  const items = new Map<string, Item>();

  const home = absoluteUrl("/");
  items.set(home, { url: home, changeFrequency: "daily", priority: 1 });

  for (const entry of fromLaravel) {
    // We build the URL from OUR site address and the path from Laravel, so the
    // sitemap always matches the pages we really serve.
    const url = absoluteUrl(entry.path);

    if (items.has(url)) continue;

    items.set(url, {
      url,
      // An ISO 8601 text from Laravel. null means "unknown", so we leave it out.
      lastModified: entry.lastmod ?? undefined,
      changeFrequency: toChangeFrequency(entry.changefreq),
      priority: entry.priority ?? undefined,
    });
  }

  const all = [...items.values()];

  if (all.length > MAX_URLS) {
    console.warn(
      `[sitemap] ${all.length} URLs is more than ${MAX_URLS}. The extra URLs are cut off. Time to split the sitemap.`,
    );
  }

  return all.slice(0, MAX_URLS);
}
