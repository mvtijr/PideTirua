export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 animate-pulse">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 sm:w-36 rounded-md bg-slate-200" />
              <div className="h-3 w-36 sm:w-48 rounded-md bg-slate-100 hidden sm:block" />
            </div>
          </div>
          <div className="h-10 w-48 sm:w-72 rounded-xl bg-slate-200/70 hidden md:block" />
          <div className="h-8 w-24 rounded-lg bg-slate-200" />
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="relative w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="max-w-2xl space-y-4">
          <div className="h-6 w-52 rounded-full bg-amber-200/80" />
          <div className="h-10 sm:h-14 w-3/4 rounded-2xl bg-slate-200" />
          <div className="h-16 w-full rounded-xl bg-slate-100" />

          {/* Search bar skeleton */}
          <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2">
            <div className="h-11 sm:w-1/3 rounded-xl bg-slate-100" />
            <div className="h-11 flex-1 rounded-xl bg-slate-100" />
            <div className="h-11 sm:w-28 rounded-xl bg-slate-300" />
          </div>
        </div>

        {/* Promos Carousel Skeleton */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded-md bg-slate-200" />
            <div className="h-7 w-16 rounded-md bg-slate-100" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-72 sm:w-80 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 space-y-3 shadow-xs"
              >
                <div className="h-36 rounded-xl bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Bar Skeleton */}
        <div className="flex gap-2 overflow-hidden pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-9 w-24 sm:w-28 shrink-0 rounded-full bg-slate-200/80"
            />
          ))}
        </div>

        {/* Locales Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs flex flex-col"
            >
              <div className="aspect-video w-full bg-slate-200" />
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-36 rounded bg-slate-200" />
                    <div className="h-5 w-16 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-3.5 w-24 rounded bg-slate-100" />
                  <div className="h-3 w-48 rounded bg-slate-100" />
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="h-4 w-20 rounded bg-slate-100" />
                  <div className="h-8 w-28 rounded-xl bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
