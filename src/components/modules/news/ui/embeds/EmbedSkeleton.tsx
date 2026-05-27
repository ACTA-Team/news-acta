/**
 * Loading skeleton matching the embed card silhouette. Used while the admin
 * modal resolves a pasted entity (SSR renders are already resolved, so the
 * article view never shows this).
 */
export function EmbedSkeleton() {
  return (
    <div
      className="my-4 overflow-hidden rounded-2xl border border-border bg-card"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="size-4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
