// lib/compare-url.ts
// The address of a compare page, and the limit of parts.
//
// No server code in this file, on purpose: a Client Component imports it too.
// (lib/compare.ts cannot be imported there. It uses lib/get-component.ts,
// which uses lib/api.ts with "use cache".)

/** The most parts one compare page shows. */
export const MAX_COMPARE = 4;

/**
 * "/compare/cpu?items=a,b". With no parts: "/compare/cpu".
 * A slug only has letters, numbers, dash and underscore (isValidSlug), so it
 * is safe to put into the URL as it is.
 */
export function compareHref(segment: string, slugs: string[]): string {
  return slugs.length > 0
    ? `/compare/${segment}?items=${slugs.join(",")}`
    : `/compare/${segment}`;
}
