import type { NextConfig } from "next";
import imageHosts from "./image-hosts.json";

// true on a test or staging server only. Set BLOCK_INDEXING=true there.
// Production does NOT set it, so a forgotten variable can never hide the real
// site from Google. (app/robots.ts reads the same variable.)
// It is read when you run "npm run build", so set it BEFORE the build.
const blockIndexing = process.env.BLOCK_INDEXING === "true";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // The hosts whose pictures the Next.js optimizer may fetch and resize.
  // The list is image-hosts.json. lib/images.ts reads the same file, so the
  // wrapper never sends the optimizer a host that is not allowed here.
  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/**",
    })),
  },

  // On staging, every response (pages, sitemap, robots.txt) says "noindex".
  // When a page also has its own robots tag, search engines use the stricter one.
  async headers() {
    if (!blockIndexing) return [];

    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
