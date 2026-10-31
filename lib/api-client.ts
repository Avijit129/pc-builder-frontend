// lib/api-client.ts
// Calls to the Laravel API that run in the BROWSER (inside Client Components).
//
// Why a second file? lib/api.ts uses "use cache", which only works on the
// server. The PC Builder calls Laravel from the browser (search while the user
// types, and the compatibility check). Never import lib/api.ts into a Client
// Component.
//
// The browser calls Laravel directly, so Laravel must allow our address (CORS).
// That is the FRONTEND_URL setting in the Laravel .env file. It must be exactly
// the address of this site, for example http://localhost:3000.

import type { ApiErrorBody } from "@/lib/types";

// Same env variable as lib/api.ts. NEXT_PUBLIC_ variables are available in the browser.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Query string values. null, undefined and "" are skipped. */
type QueryParams = Record<string, string | number | null | undefined>;

export class ClientApiError extends Error {
  /** 0 means: no answer at all (Laravel is down, or CORS blocked the call). */
  status: number;
  errors?: Record<string, string[]>;
  /** Seconds to wait. Comes from the Retry-After header of a 429 answer. */
  retryAfter: number | null;

  constructor(
    status: number,
    message: string,
    errors?: Record<string, string[]>,
    retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ClientApiError";
    this.status = status;
    this.errors = errors;
    this.retryAfter = retryAfter;
  }
}

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

type RequestOptions = {
  query?: QueryParams;
  /** Sent as JSON. Only used for POST. */
  body?: unknown;
  signal?: AbortSignal;
};

// GET and POST share this one function, so the error handling is written once.
async function request<T>(
  method: "GET" | "POST",
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  // Outside the try block on purpose: a missing env variable must not look
  // like "the server is down".
  const url = buildUrl(path, options.query);

  const hasBody = options.body !== undefined;
  const headers: Record<string, string> = { Accept: "application/json" };

  if (hasBody) headers["Content-Type"] = "application/json";

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    // A cancelled call is not an error. The caller checks signal.aborted.
    if (options.signal?.aborted) throw error;

    throw new ClientApiError(
      0,
      "Could not reach the server. Please check your connection and try again.",
    );
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    // Not JSON. Keep body as null.
  }

  if (!response.ok) {
    const errorBody = (body ?? {}) as Partial<ApiErrorBody>;
    const retryAfter = Number.parseInt(
      response.headers.get("Retry-After") ?? "",
      10,
    );

    throw new ClientApiError(
      response.status,
      errorBody.message ?? `Request failed with status ${response.status}`,
      errorBody.errors,
      Number.isFinite(retryAfter) ? retryAfter : null,
    );
  }

  if (body === null) {
    throw new ClientApiError(
      response.status,
      "The server sent an answer we could not read.",
    );
  }

  // TypeScript cannot check the JSON at runtime. We trust the API reference.
  return body as T;
}

/**
 * GET from the browser. Pass the path WITHOUT "/api", like apiGet.
 * Pass an AbortSignal to cancel the call (for example when the user types again).
 * Throws ClientApiError for every answer that is not 2xx.
 */
export function clientGet<T>(
  path: string,
  query?: QueryParams,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>("GET", path, { query, signal });
}

/**
 * POST JSON from the browser. Same rules as clientGet.
 * Used for the compatibility check (these routes need no login).
 */
export function clientPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>("POST", path, { body, signal });
}
