// Grey pulsing boxes shown while the component page is loading.
export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="h-5 w-64 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="aspect-[4/3] animate-pulse rounded-xl border bg-muted/50" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded-md bg-muted/50" />
          <div className="h-10 w-3/4 animate-pulse rounded-md bg-muted/50" />
          <div className="h-24 animate-pulse rounded-md bg-muted/50" />
          <div className="h-24 animate-pulse rounded-xl border bg-muted/50" />
        </div>
      </div>
    </div>
  );
}
