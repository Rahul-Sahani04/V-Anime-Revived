export default function AnimeDetailsLoading() {
  return (
    <div className="flex flex-col pb-24 animate-pulse">
      {/* Banner Skeleton */}
      <div className="relative h-[48vh] min-h-[340px] max-h-[500px] w-full bg-surface/60 border-b border-surface-border" />

      {/* Main Content Container */}
      <div className="container relative z-20 mx-auto px-4 lg:px-8 -mt-36">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          {/* Poster Skeleton */}
          <div className="w-48 sm:w-56 md:w-64 shrink-0 mx-auto md:mx-0">
            <div className="aspect-[2/3] w-full rounded-2xl border border-surface-border bg-surface shadow-2xl" />
            <div className="mt-4 h-12 rounded-xl bg-primary/20 md:hidden" />
          </div>

          {/* Details Header Skeleton */}
          <div className="flex-1 flex flex-col justify-end pt-2 w-full space-y-4">
            {/* Metadata Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-20 rounded-md bg-surface" />
              <div className="h-6 w-24 rounded-md bg-surface" />
              <div className="h-6 w-20 rounded-md bg-surface" />
            </div>

            {/* Title */}
            <div className="h-10 sm:h-12 w-2/3 rounded-xl bg-surface" />

            {/* Genre Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-16 rounded-full bg-surface/70" />
              <div className="h-6 w-20 rounded-full bg-surface/70" />
              <div className="h-6 w-18 rounded-full bg-surface/70" />
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-4 pt-2">
              <div className="h-12 w-48 rounded-xl bg-primary/30" />
              <div className="h-12 w-36 rounded-xl bg-surface" />
              <div className="h-12 w-28 rounded-xl bg-surface" />
            </div>

            {/* Synopsis Lines */}
            <div className="space-y-2 pt-4 max-w-3xl">
              <div className="h-4 w-full rounded bg-surface/60" />
              <div className="h-4 w-full rounded bg-surface/60" />
              <div className="h-4 w-4/5 rounded bg-surface/60" />
            </div>
          </div>
        </div>

        {/* Tab & Episodes Skeleton */}
        <div className="mt-14 border-b border-surface-border pb-3">
          <div className="flex gap-8">
            <div className="h-6 w-32 rounded bg-surface" />
            <div className="h-6 w-28 rounded bg-surface/60" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface/70 border border-surface-border flex flex-col items-center justify-center gap-2 p-3">
              <div className="h-6 w-6 rounded-full bg-surface" />
              <div className="h-3 w-12 rounded bg-surface/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
