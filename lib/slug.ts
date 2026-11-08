// lib/slug.ts
// The ONE rule for "does this look like a slug?".
// A slug is letters, numbers, dash and underscore. Checking this BEFORE we call
// Laravel also stops odd values like ".." from changing the API address.
//
// No server code in this file on purpose: browser code (lib/compare-tray.ts)
// imports it too. lib/get-component.ts cannot be imported there, because it
// uses lib/api.ts with "use cache".

const SLUG = /^[A-Za-z0-9_-]{1,200}$/;

export function isValidSlug(value: string): boolean {
  return SLUG.test(value);
}
