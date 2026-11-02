import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { BuilderApp } from "@/components/builder/builder-app";
import type { BuilderPart } from "@/lib/builder";
import { getMyBuild } from "@/lib/get-my-build";

type Props = {
  params: Promise<{ slug: string }>;
};

// The layout adds " | PC Builder" to this title. A private page must not be
// in search results. app/robots.ts allows crawling on purpose, so search
// engines can read this noindex tag.
export const metadata: Metadata = {
  title: "Edit build",
  robots: { index: false, follow: false },
};

export default function EditBuildPage(props: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* params, the cookie and the Laravel call are request data, so they
          need Suspense. */}
      <Suspense fallback={<EditSkeleton />}>
        <EditBuildContent {...props} />
      </Suspense>
    </div>
  );
}

async function EditBuildContent({ params }: Props) {
  const { slug } = await params;
  const result = await getMyBuild(slug);

  // redirect() and notFound() throw on purpose, so they are never inside
  // try/catch. After login the user comes back to this page.
  if (result.status === "needs_login") {
    redirect(`/login?next=${encodeURIComponent(`/my/builds/${slug}/edit`)}`);
  }

  // An unknown slug, or the build of another user: the same 404.
  if (result.status === "not_found") notFound();

  const { build } = result;

  // Same conversion as the shared build page: each item already has the shape
  // of a list item, which is what the builder needs.
  const parts: BuilderPart[] = build.items.map((item) => ({
    type: item.type,
    item: item.component,
    quantity: item.quantity,
  }));

  // The builder cannot show notes. PATCH replaces all parts, so saving would
  // delete them. We tell the user before it happens.
  const hasNotes = build.items.some(
    (item) => item.notes !== null && item.notes.trim() !== "",
  );

  // The name is typed by the user (React escapes it). It can be empty.
  const label = build.name?.trim() || "Untitled build";

  return (
    <>
      <Link
        href="/my/builds"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        My builds
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Edit build</h1>
      <p className="mt-2 max-w-2xl break-words text-muted-foreground">
        You are changing{" "}
        <span className="font-medium text-foreground">{label}</span>. Press
        Update build to save your changes.
      </p>

      {build.unavailable_parts > 0 && (
        <p className="mt-4 max-w-2xl rounded-lg border border-amber-500/50 p-3 text-sm">
          {build.unavailable_parts}{" "}
          {build.unavailable_parts === 1 ? "saved part is" : "saved parts are"}{" "}
          no longer available.{" "}
          {build.unavailable_parts === 1 ? "It is" : "They are"} not shown here.
          If you press Update build,{" "}
          {build.unavailable_parts === 1 ? "it is" : "they are"} removed from
          your saved build.
        </p>
      )}

      {hasNotes && (
        <p className="mt-4 max-w-2xl rounded-lg border border-amber-500/50 p-3 text-sm">
          Some parts of this build have a note. The builder cannot show notes.
          If you press Update build, the notes are removed.
        </p>
      )}

      {/* The key starts the builder fresh when the slug changes. */}
      <BuilderApp
        key={build.slug}
        initialParts={parts}
        initialName={build.name ?? ""}
        initialSlug={build.slug}
      />
    </>
  );
}

// Grey pulsing boxes while the build loads.
function EditSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="h-5 w-24 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-6 h-10 w-56 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-96 animate-pulse rounded-xl border bg-muted/50" />
        <div className="h-64 animate-pulse rounded-xl border bg-muted/50" />
      </div>
    </div>
  );
}
