"use client";

// components/builder/save-panel.tsx
// The "Save your build" box of the builder page.
//
// - First click: creates the build (POST). Then the button says "Update build".
// - Next clicks: change the same saved build (PATCH).
// - Logged out: the build is kept in sessionStorage and the user goes to the
//   login page. After login, BuilderApp brings the build back.

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveBuildAction } from "@/lib/actions/builds";
import type { BuilderPart } from "@/lib/builder";
import { saveDraft } from "@/lib/draft";

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Props = {
  parts: BuilderPart[];
  name: string;
  onNameChange: (name: string) => void;
  /** null = this build is not saved yet. */
  savedSlug: string | null;
  onSlugChange: (slug: string | null) => void;
};

type Notice = {
  kind: "success" | "error";
  text: string;
  // What the build looked like when we saved. A success message is only shown
  // while the build is still the same (see "shown" below).
  parts: BuilderPart[];
  name: string;
};

export function SavePanel({
  parts,
  name,
  onNameChange,
  savedSlug,
  onSlugChange,
}: Props) {
  const router = useRouter();
  const nameId = useId();
  // "pending" is true while the Server Action runs.
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);

  const isUpdate = savedSlug !== null;

  // After login the user comes back here: the edit page of the saved build,
  // or /builder when the build is not saved yet.
  const loginNext =
    savedSlug === null ? "/builder" : `/my/builds/${savedSlug}/edit`;

  // Every change in the builder makes a NEW parts list, so "parts !== old
  // parts" means the build changed after we saved it. Then "Build saved" would
  // be wrong, so we hide it. An error message stays until the next click.
  const shown =
    notice !== null &&
    (notice.kind === "error" ||
      (notice.parts === parts && notice.name === name))
      ? notice
      : null;

  function save() {
    setNotice(null);

    startTransition(async () => {
      try {
        const result = await saveBuildAction({
          slug: savedSlug,
          name,
          parts: parts.map((part) => ({
            type: part.type,
            component_id: part.item.id,
            quantity: part.quantity,
          })),
        });

        if (result.status === "needs_login") {
          // Keep the build, then go to login. After login Laravel's
          // redirect brings the user back to /builder.
          // The draft remembers which saved build it belongs to (null = new).
          saveDraft({ name, parts, slug: savedSlug });
          router.push(`/login?next=${encodeURIComponent(loginNext)}`);
          return;
        }

        if (result.status === "error") {
          // The saved build is gone: the next save makes a new one.
          if (result.notFound) onSlugChange(null);

          setNotice({ kind: "error", text: result.message, parts, name });
          return;
        }

        onSlugChange(result.slug);
        setNotice({
          kind: "success",
          text: result.updated
            ? "Build updated."
            : "Build saved. It is private.",
          parts,
          name,
        });
      } catch (error) {
        console.error(error);
        setNotice({
          kind: "error",
          text: "Something went wrong. Please try again.",
          parts,
          name,
        });
      }
    });
  }

  const label = pending
    ? isUpdate
      ? "Updating…"
      : "Saving…"
    : isUpdate
      ? "Update build"
      : "Save build";

  return (
    <section
      aria-labelledby="save-heading"
      className="rounded-xl border bg-card p-4"
    >
      <h2 id="save-heading" className="font-medium">
        Save your build
      </h2>

      <label htmlFor={nameId} className="mb-1 mt-3 block text-sm font-medium">
        Build name (optional)
      </label>
      <input
        id={nameId}
        type="text"
        maxLength={100}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="For example My gaming PC"
        className={fieldClass}
      />

      <Button
        type="button"
        className="mt-4 w-full"
        disabled={pending || parts.length === 0}
        onClick={save}
      >
        <Save />
        {label}
      </Button>

      {/* A live region: screen readers say the message when it appears. */}
      <div role="status">
        {shown?.kind === "success" && (
          <p className="mt-3 rounded-lg border p-3 text-sm">
            {shown.text}{" "}
            <Link href="/my/builds" className="underline underline-offset-4">
              Open My builds
            </Link>{" "}
            to change who can see it and to get the share link.
          </p>
        )}
      </div>
      {shown?.kind === "error" && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-destructive/40 p-3 text-sm"
        >
          {shown.text}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Saving needs an account. If you are logged out, we take you to the login
        page and bring your build back.
      </p>
    </section>
  );
}
