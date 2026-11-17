"use client";

// components/builds/delete-build-button.tsx
// The Delete button of one row in "My builds". It asks "Are you sure?" with
// the browser's confirm box (same as "Clear build" in the builder), then calls
// the Server Action. The action refreshes the list, so the row disappears.
//
// Keyboard focus: the row (and this button) is removed after a delete, so
// focus would fall back to the top of the page. We move it to the page
// heading, which is always there.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteBuildAction } from "@/lib/actions/builds";

// The id of the <h1> in app/my/builds/page.tsx. It must be the same text.
const HEADING_ID = "my-builds-heading";

type Props = {
  slug: string;
  /** The name shown to the user, used in the question and for screen readers. */
  label: string;
};

export function DeleteBuildButton({ slug, label }: Props) {
  const router = useRouter();
  // "pending" is true while the Server Action runs.
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    // aria-disabled does not stop the Enter key, so we stop a second call here.
    if (pending) return;

    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    setError(null);

    startTransition(async () => {
      try {
        const result = await deleteBuildAction(slug);

        if (result.status === "needs_login") {
          router.push(`/login?next=${encodeURIComponent("/my/builds")}`);
          return;
        }

        if (result.status === "deleted") {
          // The action already refreshed the list. Calling focus() in code is
          // fine here: the heading exists before and after the refresh.
          document.getElementById(HEADING_ID)?.focus();
          return;
        }

        setError(result.message);
      } catch (caught) {
        console.error(caught);
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        aria-disabled={pending || undefined}
        aria-label={`Delete ${label}`}
        onClick={remove}
      >
        <Trash2 />
        {pending ? "Deleting…" : "Delete"}
      </Button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
