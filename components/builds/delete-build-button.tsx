"use client";

// components/builds/delete-build-button.tsx
// The Delete button of one row in "My builds". It asks "Are you sure?" with
// the browser's confirm box (same as "Clear build" in the builder), then calls
// the Server Action. The action refreshes the list, so the row disappears.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteBuildAction } from "@/lib/actions/builds";

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
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    setError(null);

    startTransition(async () => {
      try {
        const result = await deleteBuildAction(slug);

        if (result.status === "needs_login") {
          router.push(`/login?next=${encodeURIComponent("/my/builds")}`);
          return;
        }

        // "deleted": nothing to do here. The action already refreshed the list.
        if (result.status === "error") setError(result.message);
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
        disabled={pending}
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
