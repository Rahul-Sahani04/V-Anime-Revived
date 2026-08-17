export default function RootLoading() {
  return (
    <div className="flex flex-col gap-12 pb-24 animate-pulse">
      {/* Hero Carousel Skeleton */}
      <div className="relative h-[78vh] min-h-[580px] max-h-[820px] w-full bg-surface/50 border-b border-surface-border">
        <div className="container mx-auto flex h-full flex-col justify-end px-4 pb-14 lg:px-8">
          <div className="max-w-3xl space-y-4">
            {/* Badges */}
            <div className="flex gap-2">
              <div className="h-6 w-28 rounded-full bg-surface" />
              <div className="h-6 w-20 rounded-full bg-surface" />
              <div className="h-6 w-16 rounded-full bg-surface" />
            </div>
            {/* Title */}
            <div className="h-12 sm:h-16 w-3/4 rounded-xl bg-surface" />
            {/* Genres */}
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded bg-surface/70" />
              <div className="h-5 w-20 rounded bg-surface/70" />
              <div className="h-5 w-14 rounded bg-surface/70" />
            </div>
            {/* Description */}
            <div className="space-y-2 max-w-2xl">
              <div className="h-4 w-full rounded bg-surface/60" />
              <div className="h-4 w-5/6 rounded bg-surface/60" />
              <div className="h-4 w-3/5 rounded bg-surface/60" />
            </div>
            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-36 rounded-xl bg-primary/30" />
              <div className="h-12 w-28 rounded-xl bg-surface" />
              <div className="h-12 w-12 rounded-xl bg-surface" />
            </div>
          </div>
        </div>
      </div>

      {/* Anime Shelf 1 Skeleton */}
      <div className="container mx-auto px-4 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 rounded-lg bg-surface" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-surface" />
            <div className="h-8 w-8 rounded-lg bg-surface" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[2/3] w-full rounded-xl bg-surface border border-surface-border" />
              <div className="h-4 w-3/4 rounded bg-surface" />
              <div className="h-3 w-1/2 rounded bg-surface/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Anime Shelf 2 Skeleton */}
      <div className="container mx-auto px-4 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 rounded-lg bg-surface" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-surface" />
            <div className="h-8 w-8 rounded-lg bg-surface" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[2/3] w-full rounded-xl bg-surface border border-surface-border" />
              <div className="h-4 w-3/4 rounded bg-surface" />
              <div className="h-3 w-1/2 rounded bg-surface/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
