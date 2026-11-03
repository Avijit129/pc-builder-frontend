import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Globe, Lock, Pencil, Plus } from "lucide-react";
import { DeleteBuildButton } from "@/components/builds/delete-build-button";
import { VisibilityControls } from "@/components/builds/visibility-controls";
import { Pagination } from "@/components/catalog/pagination";
import { Button } from "@/components/ui/button";
import { serverRequest } from "@/lib/api-server";
import { formatDate } from "@/lib/format";
import {
  DEFAULT_SORT,
  type ListParams,
  type RawSearchParams,
} from "@/lib/list-params";
import { getSessionToken } from "@/lib/session";
import { SITE_URL } from "@/lib/site";
import type { MyBuild, Paginated } from "@/lib/types";

type Props = {
  searchParams: Promise<RawSearchParams>;
};

// The layout adds " | PC Builder" to this title. A private page must not be
// in search results. app/robots.ts allows crawling on purpose, so search
// engines can read this noindex tag.
export const metadata: Metadata = {
  title: "My builds",
  robots: { index: false, follow: false },
};

// Where a logged-out visitor goes. After login they come back here.
const LOGIN_URL = `/login?next=${encodeURIComponent("/my/builds")}`;

// The Pagination component was made for the list pages and needs a ListParams
// object. This page has no search or filters, so we pass an empty one.
const NO_FILTERS: ListParams = {
  search: "",
  sort: DEFAULT_SORT,
  page: 1,
  manufacturer: "",
  filters: {},
};

// ?page=abc or ?page=0 is not valid, so it becomes page 1.
function parsePage(raw: RawSearchParams): number {
  const value = Array.isArray(raw.page) ? raw.page[0] : raw.page;
  const number = Number.parseInt(value ?? "", 10);

  return Number.isInteger(number) && number >= 1 ? Math.min(number, 10000) : 1;
}

export default function MyBuildsPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My builds</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The builds you saved. A private build can only be seen by you.
          </p>
        </div>

        <Button asChild>
          <Link href="/builder">
            <Plus />
            New build
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {/* The cookie and searchParams are request data, so they need Suspense. */}
        <Suspense fallback={<BuildsSkeleton />}>
          <MyBuildsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function MyBuildsContent({ searchParams }: Props) {
  const page = parsePage(await searchParams);
  const token = await getSessionToken();

  // redirect() throws on purpose, so it is never inside try/catch.
  if (token === null) redirect(LOGIN_URL);

  const response = await serverRequest<Paginated<MyBuild>>(
    "GET",
    `/my/builds?page=${page}`,
    { token },
  );

  if (!response.ok) {
    // An expired or deleted token. The login page shows the form again.
    if (response.status === 401) redirect(LOGIN_URL);

    // Laravel is down, 429, 500 ... The error.tsx file next to this page shows it.
    throw new Error(response.message);
  }

  const { data: builds, meta } = response.data;

  // For example: you deleted the only build on page 2. Go to the last real page.
  if (meta.current_page > meta.last_page) {
    redirect(
      meta.last_page > 1 ? `/my/builds?page=${meta.last_page}` : "/my/builds",
    );
  }

  if (builds.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">You have no saved builds yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose your parts in the builder and press Save build.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/builder">Start a build</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {meta.total} {meta.total === 1 ? "build" : "builds"}
      </p>

      <ul className="mt-4 space-y-3">
        {builds.map((build) => (
          <li key={build.slug}>
            <BuildRow build={build} />
          </li>
        ))}
      </ul>

      <Pagination
        segment="my/builds"
        params={NO_FILTERS}
        currentPage={meta.current_page}
        lastPage={meta.last_page}
      />
    </>
  );
}

function BuildRow({ build }: { build: MyBuild }) {
  // The name is typed by the user (React escapes it). It can be empty.
  const label = build.name?.trim() || "Untitled build";
  const updated = formatDate(build.updated_at);
  const parts = build.parts_count;

  // public_path is null while the build is private. The full address is built
  // here on the server, from the site address (NEXT_PUBLIC_SITE_URL).
  const shareUrl = build.public_path
    ? new URL(build.public_path, SITE_URL).toString()
    : null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words font-medium">{label}</h2>
            <VisibilityBadge isPublic={build.is_public} />
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {typeof parts === "number" &&
              `${parts} ${parts === 1 ? "part" : "parts"}`}
            {typeof parts === "number" && updated && " · "}
            {updated && (
              <>
                Updated <time dateTime={build.updated_at}>{updated}</time>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* aria-label: a page can have many "Edit" links, so each one needs its own name. */}
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/my/builds/${build.slug}/edit`}
              aria-label={`Edit ${label}`}
            >
              <Pencil />
              Edit
            </Link>
          </Button>

          {build.public_path && (
            <Button asChild variant="outline" size="sm">
              <Link href={build.public_path}>View public page</Link>
            </Button>
          )}

          <DeleteBuildButton slug={build.slug} label={label} />
        </div>
      </div>

      <VisibilityControls
        slug={build.slug}
        label={label}
        isPublic={build.is_public}
        shareUrl={shareUrl}
      />
    </div>
  );
}

// Never colour alone: the badge has an icon and a word.
function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  const Icon = isPublic ? Globe : Lock;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
      <Icon className="size-3" aria-hidden="true" />
      {isPublic ? "Public" : "Private"}
    </span>
  );
}

// Grey pulsing rows while the list loads.
function BuildsSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-xl border bg-muted/50"
        />
      ))}
    </div>
  );
}
