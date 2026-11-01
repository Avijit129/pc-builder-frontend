// lib/api-server.ts
// Calls to the Laravel API from the SERVER that are NOT cached.
//
// Use this for logged-in calls and for POST calls (login, register, later "save
// build"). Do NOT use lib/api.ts for them: that file caches every answer, and a
// cached function must never depend on a user token.
//
// It never throws for an error answer (401, 422, 429 ...). It returns an object
// with ok: false, so the caller decides what to show. Only a missing
// NEXT_PUBLIC_API_URL throws (that is a developer mistake).

import { buildUrl } from "@/lib/api";
import type { ApiErrorBody } from "@/lib/types";

export type SuccessResponse<T> = { ok: true; status: number; data: T };

export type FailedResponse = {
  ok: false;
  /** 0 means: no answer at all (Laravel is down). */
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  /** Seconds to wait. Comes from the Retry-After header of a 429 answer. */
  retryAfter: number | null;
};

export type ServerResponse<T> = SuccessResponse<T> | FailedResponse;

type Options = {
  /** Sent as JSON. */
  body?: unknown;
  /** The Sanctum token. Sent as "Authorization: Bearer ...". */
  token?: string | null;
};

export async function serverRequest<T>(
  method: "GET" | "POST",
  path: string,
  options: Options = {},
): Promise<ServerResponse<T>> {
  // Outside the try block on purpose: a missing env variable must not look
  // like "Laravel is down".
  const url = buildUrl(path);

  const headers: Record<string, string> = { Accept: "application/json" };

  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      // Never reuse an old answer.
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Could not reach the server. Please try again in a moment.",
      retryAfter: null,
    };
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    // An empty body (204) or not JSON. Keep body as null.
  }

  if (!response.ok) {
    const errorBody = (body ?? {}) as Partial<ApiErrorBody>;
    const retryAfter = Number.parseInt(
      response.headers.get("Retry-After") ?? "",
      10,
    );

    return {
      ok: false,
      status: response.status,
      message:
        errorBody.message ?? `Request failed with status ${response.status}`,
      errors: errorBody.errors,
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : null,
    };
  }

  // 204 has no body on purpose (for example logout).
  if (response.status === 204) {
    return { ok: true, status: 204, data: null as unknown as T };
  }

  if (body === null) {
    return {
      ok: false,
      status: response.status,
      message: "The server sent an answer we could not read.",
      retryAfter: null,
    };
  }

  // TypeScript cannot check the JSON at runtime. We trust the API reference.
  return { ok: true, status: response.status, data: body as T };
}
