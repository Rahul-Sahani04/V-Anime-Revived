export default function WatchPlayerLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 animate-pulse">
      {/* Video Theater Skeleton */}
      <div className="relative w-full bg-black/90 py-4 lg:py-6 border-b border-surface-border">
        <div className="container relative z-10 mx-auto px-4 lg:px-8 max-w-6xl">
          {/* 16:9 Aspect Video Skeleton */}
          <div className="aspect-video w-full rounded-2xl bg-surface border border-surface-border flex items-center justify-center shadow-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <span className="text-xs font-semibold text-muted">Preparing stream player...</span>
            </div>
          </div>

          {/* Quick Player Bar Skeleton */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-5 w-24 rounded bg-surface" />
              <div className="h-5 w-20 rounded bg-surface" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 rounded-lg bg-surface" />
              <div className="h-8 w-24 rounded-lg bg-primary/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Settings & Episode Selector Skeletons */}
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-28 rounded-2xl bg-surface/70 border border-surface-border p-5" />
            <div className="h-28 rounded-2xl bg-surface/70 border border-surface-border p-5" />
          </div>
          <div className="h-[320px] rounded-2xl bg-surface/70 border border-surface-border p-5" />
        </div>
      </div>
    </div>
  );
}
