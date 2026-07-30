/** Lightweight skeleton shown while a lazily-loaded route chunk streams in. */
export default function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6" role="status" aria-label="Loading">
      <div className="h-40 w-full animate-pulse rounded-3xl bg-muted/70" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted/60" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted/50" />
        <div className="h-40 w-full animate-pulse rounded-3xl bg-muted/50" />
      </div>
    </div>
  );
}
