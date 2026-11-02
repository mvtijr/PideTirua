"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registro preventivo de error para diagnóstico
    console.error("Error capturado por boundary global en PideTirúa:", error);
  }, [error]);

  return (
    <main className="relative min-h-screen w-full bg-[#FAF8F5] text-[#18181B] font-body flex flex-col justify-between selection:bg-[#EA580C] selection:text-white overflow-hidden">
      {/* Fondo con degradado cálido orgánico y grano fino de la página principal */}
      <GradientBackground
        gradientType="radial-gradient"
        gradientOrigin="top-middle"
        gradientSize="140% 120%"
        colors={[
          { color: "rgba(254, 240, 218, 0.75)", stop: "0%" },
          { color: "rgba(254, 215, 170, 0.4)", stop: "30%" },
          { color: "rgba(250, 248, 245, 0.85)", stop: "65%" },
          { color: "rgba(250, 248, 245, 1)", stop: "100%" },
        ]}
        noiseIntensity={0.65}
        noisePatternAlpha={34}
        noisePatternSize={90}
        noisePatternRefreshInterval={0}
      />

      {/* Cabecera mínima institucional */}
      <header className="relative z-10 w-full border-b border-stone-200/80 bg-[#FAF8F5]/90 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform active:scale-95"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-stone-200 bg-white p-0.5 shadow-xs overflow-hidden shrink-0">
              <img
                src="/logo-pidetirua.jpg"
                alt="PideTirúa"
                width={44}
                height={44}
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0">
              <span className="font-display text-xl sm:text-2xl tracking-widest text-[#18181B] uppercase block leading-none">
                PIDETIRÚA
              </span>
              <span className="font-body text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-[0.2em] text-[#C2410C] block mt-0.5">
                SABORES DE NUESTRA TIERRA
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white hover:border-orange-300 hover:bg-orange-50/50 text-stone-800 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 transition active:scale-95 shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#C2410C]" />
            <span>Inicio</span>
          </Link>
        </div>
      </header>

      {/* Contenido Central: Tarjeta con estética de la página principal */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-lg rounded-3xl border border-stone-200/90 bg-white p-7 sm:p-10 shadow-xl shadow-stone-200/50 text-center space-y-6">
          {/* Icono de Alerta Cálido */}
          <div className="mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-rose-50 border-2 border-rose-200/80 text-rose-600 shadow-md shadow-rose-950/5">
            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 transition-transform duration-300 hover:scale-110" />
          </div>

          <div className="space-y-3">
            {/* Badge de Estado */}
            <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              <span>AVISO DE CONEXIÓN</span>
            </div>

            {/* Título con tipografía Bebas Neue */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#18181B] tracking-tight uppercase leading-none">
              ALGO NO SALIÓ COMO ESPERÁBAMOS
            </h1>

            {/* Subtítulo descriptivo en Montserrat */}
            <p className="font-body text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
              Pudo haber una pausa momentánea en la señal de internet móvil o en la carga de datos. Puedes reintentar la operación o volver a la portada de Tirúa.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#EA580C] hover:bg-[#c2410c] text-white px-6 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest shadow-md shadow-orange-600/20 transition-all hover:scale-[1.01] active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Intentar de nuevo</span>
            </button>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 px-6 py-3 text-xs font-bold uppercase tracking-wider transition active:scale-95"
            >
              <Home className="h-4 w-4 text-[#C2410C]" />
              <span>Volver a la portada de Tirúa</span>
            </Link>
          </div>

          {/* Digest técnico opcional para soporte */}
          {error.digest && (
            <p className="border-t border-stone-200/80 pt-3 text-[11px] text-stone-400 font-mono">
              ID de diagnóstico: {error.digest}
            </p>
          )}
        </div>
      </div>

      {/* Pie de página institucional */}
      <footer className="relative z-10 w-full border-t border-stone-200/80 bg-[#FAF8F5]/80 py-4 px-4 text-center text-xs text-stone-500 font-medium">
        <p>PideTirúa • Sabores de nuestra tierra — Tirúa y Quidico, Región del Biobío</p>
      </footer>
    </main>
  );
}
