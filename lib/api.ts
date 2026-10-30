// lib/api.ts
// One small function to read PUBLIC data from the Laravel API.
//
// Use it in Server Components, like this:
//   const cpus = await apiGet<Paginated<CpuListItem>>("/cpus", { per_page: 12 });
//   const cpu  = await apiGet<ApiData<CpuDetail>>(`/cpus/${slug}`);
//
// Do NOT use it for logged-in routes (/my/builds, /auth/me). A cached function
// must not depend on a user token. We will make a separate function for those.

import { cacheLife } from "next/cache";
import type { ApiErrorBody } from "@/lib/types";

// One env variable for the API address. Set it in .env.local:
//   NEXT_PUBLIC_API_URL=http://localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Query string values. null, undefined and "" are skipped. */
export type QueryParams = Record<string, string | number | null | undefined>;

/**
 * Thrown when Laravel answers with an error (404, 422, 429, 500 ...).
 * In a page you can do:
 *   catch (error) {
 *     if (error instanceof ApiError && error.status === 404) notFound();
 *     throw error;
 *   }
 */
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/** "/cpus" + { per_page: 12 }  ->  "http://localhost:8000/api/cpus?per_page=12" */
function buildUrl(path: string, query?: QueryParams): string {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local and restart the dev server.",
    );
  }

  const url = new URL(`/api${path}`, API_URL);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === null || value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

type RawResponse = { ok: boolean; status: number; body: unknown };

/**
 * The cached part. It only takes a URL string, so the cache key is simple:
 * the same URL always uses the same cached answer.
 *
 * It returns the answer (also for 404 and 422) instead of throwing, so the
 * error class is never lost. apiGet below throws the ApiError.
 */
async function fetchCached(url: string): Promise<RawResponse> {
  "use cache";

  let response: Response;

  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    // Laravel is down or the URL is wrong. Throw, so nothing is cached.
    throw new Error(`Could not reach the API at ${url}. Is Laravel running?`);
  }

  // Good answers are reused for a few minutes (prices change, so not hours).
  // Error answers live only seconds, so a fix shows up fast.
  const cacheProfile = response.ok
    ? { stale: 300, revalidate: 60, expire: 3600 }
    : { stale: 30, revalidate: 1, expire: 60 };

  cacheLife(cacheProfile);

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    // Not JSON (for example an HTML error page). Keep body as null.
  }

  return { ok: response.ok, status: response.status, body };
}

/**
 * GET one public endpoint of the Laravel API. Pass the path WITHOUT "/api".
 * T is the full response type, for example Paginated<CpuListItem>
 * or ApiData<CpuDetail>.
 */
export async function apiGet<T>(path: string, query?: QueryParams): Promise<T> {
  const result = await fetchCached(buildUrl(path, query));

  if (!result.ok) {
    const body = (result.body ?? {}) as Partial<ApiErrorBody>;

    throw new ApiError(
      result.status,
      body.message ?? `Request failed with status ${result.status}`,
      body.errors,
    );
  }

  // TypeScript cannot check the JSON at runtime. We trust the API reference.
  return result.body as T;
}
