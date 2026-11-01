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

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default function RegisterPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Create an account
      </h1>
      <p className="mt-2 text-muted-foreground">
        An account lets you save your builds and share them with a link.
      </p>

      <div className="mt-8">
        <Suspense fallback={<AuthFormSkeleton />}>
          <AuthPageContent mode="register" searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
