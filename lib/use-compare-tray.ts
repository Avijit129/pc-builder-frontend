// lib/use-compare-tray.ts
// A React hook for the compare tray of ONE category. The cards and the tray
// bar both use it, and they always show the same thing, because they read the
// same storage.
//
// useSyncExternalStore is made for data that lives outside React. It asks the
// server for an empty tray (getServerSnapshot), so the first page the browser
// draws matches the server, and then it switches to the real tray. No effect,
// no setState, no hydration error.

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  clearSegment,
  getServerSnapshot,
  getSnapshot,
  slugsFor,
  subscribe,
  toggleSlug,
} from "@/lib/compare-tray";
import { MAX_COMPARE } from "@/lib/compare-url";

export function useCompareTray(segment: string) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // The same text always gives the same list, so this only runs when the
  // storage or the category changes.
  const slugs = useMemo(() => slugsFor(raw, segment), [raw, segment]);

  const toggle = useCallback(
    (slug: string) => toggleSlug(segment, slug),
    [segment],
  );
  const clear = useCallback(() => clearSegment(segment), [segment]);

  return { slugs, isFull: slugs.length >= MAX_COMPARE, toggle, clear };
}
