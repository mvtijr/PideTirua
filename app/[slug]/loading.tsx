export default function LocalMenuLoading() {
  return (
    <div className="relative min-h-screen bg-[#FAF8F5] pb-28 animate-pulse">
      {/* Mobile-First Container */}
      <div className="mx-auto max-w-xl min-h-screen bg-[#FAF8F5] shadow-xl sm:border-x sm:border-stone-200/90 overflow-hidden">
        {/* Banner Portada Skeleton */}
        <div className="relative h-56 sm:h-64 w-full bg-stone-300">
          {/* Top Bar Buttons */}
          <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
            <div className="h-8 w-28 rounded-full bg-white/80 backdrop-blur-md" />
            <div className="h-8 w-20 rounded-full bg-white/80 backdrop-blur-md" />
          </div>

          {/* Logo y Nombre sobre el Banner */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3.5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white border-4 border-white shadow-lg shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-5 w-24 rounded-full bg-white/80" />
              <div className="h-7 w-44 rounded-lg bg-white/90" />
              <div className="h-3.5 w-32 rounded-full bg-white/70" />
            </div>
          </div>
        </div>

        {/* Datos Rápidos y Horario */}
        <div className="p-4 border-b border-stone-200/90 flex items-center justify-between gap-3 bg-white">
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded-full bg-stone-200" />
            <div className="h-3 w-28 rounded-full bg-stone-100" />
          </div>
          <div className="h-8 w-28 rounded-full bg-stone-200 shrink-0" />
        </div>

        {/* Buscador de Platos Skeleton */}
        <div className="p-4 pb-2">
          <div className="h-11 w-full rounded-full bg-white border border-stone-200/90" />
        </div>

        {/* Pestañas de Categorías Skeleton */}
        <div className="flex gap-2 px-4 py-2.5 overflow-hidden border-b border-stone-200/90 bg-[#FAF8F5]">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-7 w-20 sm:w-24 shrink-0 rounded-full bg-stone-200/80"
            />
          ))}
        </div>

        {/* Lista de Platos Skeleton (4 Tarjetas) */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div className="h-6 w-32 rounded-lg bg-stone-200" />
            <div className="h-4 w-16 rounded-full bg-stone-200" />
          </div>

          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex gap-3.5 rounded-2xl border border-stone-200/90 bg-white p-3.5 sm:p-4 shadow-xs"
            >
              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-1.5">
                  <div className="h-5 w-32 sm:w-40 rounded-lg bg-stone-200" />
                  <div className="h-3 w-full rounded bg-stone-100" />
                  <div className="h-3 w-4/5 rounded bg-stone-100" />
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <div className="h-5 w-20 rounded bg-stone-200" />
                  <div className="h-9 w-24 rounded-full bg-stone-200" />
                </div>
              </div>
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-stone-100 border border-stone-200/80 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
