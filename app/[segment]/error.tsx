"use client";

// Shown when something throws while the page loads (for example Laravel is
// not running). Error boundaries must be Client Components.

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SegmentError({ reset }: Props) {
  const router = useRouter();

  function retry() {
    // refresh() asks the server for fresh data, reset() shows the page again.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        We could not load this page. Please try again in a moment.
      </p>
      <Button className="mt-6" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
