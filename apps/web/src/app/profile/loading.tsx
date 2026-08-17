export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-5xl pb-28 animate-pulse">
      {/* Profile Header Skeleton */}
      <div className="rounded-3xl border border-surface-border bg-surface/60 p-8 mb-8">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-surface border border-surface-border" />
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg bg-surface" />
            <div className="h-4 w-60 rounded bg-surface/60" />
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="mb-10 space-y-4">
        <div className="h-5 w-44 rounded bg-surface" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-surface-border bg-surface/60 p-5" />
          ))}
        </div>
      </div>

      {/* Preferences Skeleton */}
      <div className="space-y-6">
        <div className="h-5 w-52 rounded bg-surface" />
        <div className="h-32 rounded-2xl border border-surface-border bg-surface/60" />
        <div className="h-48 rounded-2xl border border-surface-border bg-surface/60" />
      </div>
    </div>
  );
}
