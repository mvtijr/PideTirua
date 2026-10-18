import Link from "next/link";
import { ArrowLeft, Store, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 text-center selection:bg-amber-500 selection:text-slate-950">
      {/* Halo de luz decorativo */}
      <div className="absolute top-1/4 -z-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Identidad visual de Tirúa */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 shadow-inner">
          <Store className="h-10 w-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
            <Compass className="h-3.5 w-3.5" />
            PideTirúa Comunal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ups, este local o página no existe
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            El restaurante, carta digital o enlace que escaneaste no se encuentra activo o fue renombrado en Tirúa y Quidico.
          </p>
        </div>

        {/* Botón Destacado */}
        <div className="pt-2">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-4 text-sm font-black text-slate-950 shadow-lg shadow-orange-950/30 transition hover:from-amber-400 hover:to-rose-400 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← Volver a los locales de Tirúa</span>
          </Link>
        </div>

        {/* Enlace sutil al pie */}
        <div className="border-t border-white/10 pt-4 text-xs text-slate-500">
          <span>¿Eres dueño de un local? </span>
          <Link
            href="/superadmin"
            className="font-bold text-amber-400 hover:text-amber-300 hover:underline"
          >
            Acceso SuperAdmin
          </Link>
        </div>
      </div>
    </main>
  );
}
