import {
  Waves,
  MapPin,
  QrCode,
  MessageCircle,
  Compass,
  ShieldCheck,
} from "lucide-react";
import { getAllLocales } from "@/lib/locales";
import DirectoryClient from "@/components/DirectoryClient";

export default function DirectorioComunalPage() {
  const locales = getAllLocales();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Hero Header con identidad costera/local */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950 to-teal-900 pb-20 pt-8 text-white">
        {/* Decoración de olas / brisa costera */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* Barra superior */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25">
                <Waves className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white">
                  Pide<span className="text-amber-400">Tirúa</span>
                </span>
                <span className="block text-[11px] font-medium text-sky-200">
                  Tirúa Centro · Quidico · Región del Biobío
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-100 backdrop-blur-md">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                Provincia de Arauco, Chile
              </span>
            </div>
          </div>

          {/* Contenido Hero Principal */}
          <div className="mt-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
              <Compass className="h-3.5 w-3.5" />
              <span>Directorio Gastronómico &amp; Menú Digital QR</span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl sm:leading-[1.12]">
              PideTirúa -{" "}
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-sky-300 bg-clip-text text-transparent">
                Sabores de nuestra tierra
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-sky-100/90 sm:text-lg">
              Descubre la gastronomía costera de <strong>Tirúa</strong> y{" "}
              <strong>Quidico</strong>. Revisa la carta actualizada de cada
              local, arma tu pedido desde tu celular y envíalo directo al{" "}
              <strong className="text-emerald-300">WhatsApp (+569)</strong> sin
              comisiones ni intermediarios.
            </p>

            {/* Píldoras de beneficios */}
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-sky-100">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-xs">
                <QrCode className="h-4 w-4 text-amber-400" />
                <span>Carta QR exclusiva por local</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-xs">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span>Pedido directo a WhatsApp (+569)</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-xs">
                <ShieldCheck className="h-4 w-4 text-sky-300" />
                <span>Delivery, Retiro o Consumo en mesa</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Directorio interactivo con buscador, filtros y tarjetas */}
      <main className="flex-1">
        <DirectoryClient locales={locales} />
      </main>

      {/* Footer Comunal */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-amber-400">
              <Waves className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-800">
              PideTirúa — Sabores de nuestra tierra
            </span>
          </div>
          <p>
            Plataforma gastronómica para emprendedores y locales de Tirúa y
            Quidico, Región del Biobío, Chile.
          </p>
        </div>
      </footer>
    </div>
  );
}
