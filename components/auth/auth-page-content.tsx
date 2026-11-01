// components/auth/auth-page-content.tsx
// The part of the login and register pages that needs request data
// (searchParams and the cookie). The page wraps it in <Suspense>.

import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import type { RawSearchParams } from "@/lib/list-params";
import { safeNextPath } from "@/lib/safe-redirect";

type Props = {
  mode: "login" | "register";
  searchParams: Promise<RawSearchParams>;
};

export async function AuthPageContent({ mode, searchParams }: Props) {
  const raw = await searchParams;

  // ?next=a&next=b gives an array. We only use the first value.
  const value = Array.isArray(raw.next) ? raw.next[0] : raw.next;
  const next = safeNextPath(value);

  // A logged-in user has nothing to do here. We ask Laravel (getCurrentUser)
  // and do not only check that a cookie exists. An old cookie of an expired
  // token must NOT block the login form.
  const user = await getCurrentUser();

  if (user) redirect(next);

  return <AuthForm mode={mode} next={next} />;
}

// Grey pulsing boxes while the page waits for the cookie and Laravel.
export function AuthFormSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <div className="h-14 animate-pulse rounded-md bg-muted/50" />
      <div className="h-14 animate-pulse rounded-md bg-muted/50" />
      <div className="h-9 animate-pulse rounded-md bg-muted/50" />
    </div>
  );
}
