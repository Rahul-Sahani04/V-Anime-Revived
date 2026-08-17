export default function LibraryLoading() {
  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-6xl pb-24 animate-pulse">
      {/* Header Profile Bar Skeleton */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-border pb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-surface border border-surface-border" />
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-lg bg-surface" />
            <div className="h-4 w-72 rounded bg-surface/60" />
          </div>
        </div>
        <div className="h-10 w-full md:w-72 rounded-xl bg-surface" />
      </div>

      {/* Tabs Skeleton */}
      <div className="mb-8 flex items-center gap-3 border-b border-surface-border pb-3">
        <div className="h-10 w-36 rounded-xl bg-primary/20" />
        <div className="h-10 w-28 rounded-xl bg-surface" />
        <div className="h-10 w-28 rounded-xl bg-surface" />
        <div className="h-10 w-28 rounded-xl bg-surface" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-[2/3] w-full rounded-xl bg-surface border border-surface-border" />
            <div className="h-4 w-3/4 rounded bg-surface" />
            <div className="h-3 w-1/2 rounded bg-surface/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
