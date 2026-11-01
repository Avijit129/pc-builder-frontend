import type { Metadata } from "next";
import { Suspense } from "react";
import {
  AuthFormSkeleton,
  AuthPageContent,
} from "@/components/auth/auth-page-content";
import type { RawSearchParams } from "@/lib/list-params";

type Props = {
  searchParams: Promise<RawSearchParams>;
};

// The layout adds " | PC Builder" to this title. A login page must not appear
// in search results. app/robots.ts allows crawling on purpose, so search
// engines can read this noindex tag.
export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
};

export default function LoginPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-muted-foreground">
        Log in to your PC Builder account.
      </p>

      <div className="mt-8">
        <Suspense fallback={<AuthFormSkeleton />}>
          <AuthPageContent mode="login" searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
