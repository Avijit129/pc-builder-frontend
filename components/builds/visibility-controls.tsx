"use client";

// components/builds/visibility-controls.tsx
// The bottom part of a row in "My builds":
// - a button that switches the build between private and public, and
// - when it is public: the share link and a Copy button.
//
// It keeps no copy of "is public". The Server Action refreshes the page, and
// the new values arrive as props (see revalidatePath in lib/actions/builds.ts).

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setBuildVisibilityAction } from "@/lib/actions/builds";

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Props = {
  slug: string;
  /** The name shown to the user. Used for screen readers. */
  label: string;
  isPublic: boolean;
  /** The full address of the public page. null while the build is private. */
  shareUrl: string | null;
};

type CopyState = "idle" | "copied" | "failed";

export function VisibilityControls({ slug, label, isPublic, shareUrl }: Props) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // "pending" is true while the Server Action runs and the list reloads.
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  function toggle() {
    setError(null);

    startTransition(async () => {
      try {
        const result = await setBuildVisibilityAction(slug, !isPublic);

        if (result.status === "needs_login") {
          router.push(`/login?next=${encodeURIComponent("/my/builds")}`);
          return;
        }

        // "updated": nothing to do here. The page loads the new values.
        if (result.status === "error") setError(result.message);
      } catch (caught) {
        console.error(caught);
        setError("Something went wrong. Please try again.");
      }
    });
  }

  async function copy() {
    if (shareUrl === null) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      // Copying is blocked (for example the site is not on https). We select
      // the text, so the user can press Ctrl+C.
      inputRef.current?.select();
      setCopyState("failed");
    }

    setTimeout(() => setCopyState("idle"), 2500);
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={toggle}
        >
          {isPublic ? <Lock /> : <Globe />}
          {pending ? "Saving…" : isPublic ? "Make private" : "Make public"}
          <span className="sr-only"> ({label})</span>
        </Button>

        {isPublic && shareUrl !== null && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label htmlFor={inputId} className="sr-only">
              Share link of {label}
            </label>
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              className={fieldClass}
            />
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              {copyState === "copied" ? <Check /> : <Copy />}
              {copyState === "copied" ? "Copied" : "Copy link"}
              <span className="sr-only"> for {label}</span>
            </Button>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {isPublic
          ? "Anyone with the link can see this build. We ask search engines not to list it."
          : "Only you can see this build."}
      </p>

      {/* A live region: screen readers say the message when it appears. */}
      <div role="status">
        {copyState === "failed" && (
          <p className="mt-2 text-sm">
            We could not copy the link by ourselves. It is selected now. Press
            Ctrl+C.
          </p>
        )}
        {copyState === "copied" && <p className="sr-only">Link copied.</p>}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
