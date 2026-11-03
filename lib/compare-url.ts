// lib/compare-url.ts
// The address of a compare page, and the limit of parts.
//
// No server code in this file, on purpose: a Client Component imports it too.
// (lib/compare.ts cannot be imported there. It uses lib/get-component.ts,
// which uses lib/api.ts with "use cache".)

/** The most parts one compare page shows. */
export const MAX_COMPARE = 4;

type CompareHrefOptions = {
  /** true: the table only shows the specs that are different (?diff=1). */
  diffOnly?: boolean;
};

/**
 * "/compare/cpu?items=a,b" or "/compare/cpu?items=a,b&diff=1".
 * With no parts and no options: "/compare/cpu".
 * A slug only has letters, numbers, dash and underscore (isValidSlug), so it
 * is safe to put into the URL as it is.
 */
export function compareHref(
  segment: string,
  slugs: string[],
  options: CompareHrefOptions = {},
): string {
  const query: string[] = [];

  if (slugs.length > 0) query.push(`items=${slugs.join(",")}`);
  if (options.diffOnly) query.push("diff=1");

  return query.length > 0
    ? `/compare/${segment}?${query.join("&")}`
    : `/compare/${segment}`;
}
