"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registro preventivo de error para diagnóstico SRE
    console.error("Error capturado por boundary global en PideTirúa:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center selection:bg-orange-600 selection:text-white">
      {/* Halo de luz de advertencia suave */}
      <div className="absolute top-1/4 -z-10 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Icono de Alerta */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shadow-inner">
          <AlertTriangle className="h-10 w-10 transition-transform duration-300 hover:scale-110" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-300">
            Aviso de Conexión
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Algo no salió como esperábamos
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Pudo haber una pausa momentánea en la señal de internet móvil o en la carga de datos. Puedes reintentar la operación o volver a la portada de Tirúa.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-4 text-sm font-black text-slate-950 shadow-lg shadow-orange-950/30 transition hover:from-amber-400 hover:to-rose-400 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Intentar de nuevo</span>
          </button>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95"
          >
            <Home className="h-4 w-4" />
            <span>Volver al inicio</span>
          </Link>
        </div>

        {/* Digest técnico opcional para soporte */}
        {error.digest && (
          <p className="border-t border-white/10 pt-3 text-[10px] text-slate-600 font-mono">
            ID de diagnóstico: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
