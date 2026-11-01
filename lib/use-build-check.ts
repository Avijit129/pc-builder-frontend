// lib/use-build-check.ts
// A React hook that sends the build to Laravel
// (POST /api/compatibility/check-build) and returns the answer.
// Call it ONCE per page. Everything that shows the result reads from it.
//
// How the loading works (same idea as part-picker.tsx):
// - "bodyKey" is the request body as text. It only changes when the parts
//   really change.
// - The effect waits 500 ms, then sends the request. A new change cancels the
//   old timer and the old call, so a fast clicker sends only ONE request.
// - Every answer is saved with its "key". If the saved key is not the current
//   key, we are still waiting. That way we never call setState directly in an
//   effect (the strict React lint rules do not allow it).

import { useCallback, useEffect, useState } from "react";
import { ClientApiError, clientPost } from "@/lib/api-client";
import type { BuilderPart } from "@/lib/builder";
import { buildCompatibilityBody } from "@/lib/compatibility";
import type { ApiData, BuildCheckResult, CompatibilityBody } from "@/lib/types";

// Laravel allows 60 checks per minute per IP address, so we wait a little.
const DEBOUNCE_MS = 500;

type Answer = {
  key: string;
  result?: BuildCheckResult;
  error?: string;
};

export type BuildCheckState = {
  /** false when the build has fewer than 2 kinds of part. No request is sent. */
  enabled: boolean;
  /** true while a request is waiting or running. */
  loading: boolean;
  /**
   * The newest result we have. While "loading" is true it belongs to an OLDER
   * build, so show it faded or do not show it as current.
   */
  result: BuildCheckResult | null;
  /** A message for the user, or null. */
  error: string | null;
  /** Send the same check again (the "Try again" button). */
  retry: () => void;
};

// What the user reads when something goes wrong.
function errorMessage(error: ClientApiError): string {
  if (error.status === 429) {
    return error.retryAfter === null
      ? "Too many checks in a short time. Please wait a moment and try again."
      : `Too many checks in a short time. Please wait ${error.retryAfter} seconds and try again.`;
  }

  // A 422 has a message per field. Show the first one.
  if (error.status === 422 && error.errors) {
    const first = Object.values(error.errors)[0]?.[0];

    if (first) return first;
  }

  return error.message;
}

export function useBuildCheck(parts: BuilderPart[]): BuildCheckState {
  const body = buildCompatibilityBody(parts);
  const bodyKey = body === null ? null : JSON.stringify(body);

  // Goes up by 1 when the user presses "Try again".
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);

  const key = `${bodyKey ?? "none"}|${attempt}`;

  useEffect(() => {
    // Fewer than 2 kinds of part: nothing to check.
    if (bodyKey === null) return;

    const controller = new AbortController();

    const timer = setTimeout(() => {
      // We depend on the TEXT (bodyKey), not on an object. A new object with
      // the same content must not start a new request.
      clientPost<ApiData<BuildCheckResult>>(
        "/compatibility/check-build",
        JSON.parse(bodyKey) as CompatibilityBody,
        controller.signal,
      )
        .then((response) => {
          if (controller.signal.aborted) return;
          setAnswer({ key, result: response.data });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;

          if (error instanceof ClientApiError) {
            setAnswer({ key, error: errorMessage(error) });
            return;
          }

          console.error(error);
          setAnswer({ key, error: "Something went wrong. Please try again." });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [bodyKey, key]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  // The answer is "current" only when it belongs to the current key.
  const current = answer !== null && answer.key === key ? answer : null;

  return {
    enabled: bodyKey !== null,
    loading: bodyKey !== null && current === null,
    result: answer?.result ?? null,
    error: current?.error ?? null,
    retry,
  };
}
