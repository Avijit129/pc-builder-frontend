// Grey pulsing boxes shown while the list is loading.
export function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="h-16 animate-pulse rounded-md bg-muted/50" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-xl border bg-muted/50"
          />
        ))}
      </div>
    </div>
  );
}
