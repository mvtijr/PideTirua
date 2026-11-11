import Link from "next/link";
import { ArrowRight, Store, Fish, QrCode } from "lucide-react";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";
import { TopDownLetters } from "@/components/ui/top-down-letters";

export function HomeEditorialContent() {
  return (
    <>
      {/* 6. IDENTIDAD TERRITORIAL: TIRÚA Y CALETA QUIDICO */}
      <section
        id="historia-comuna"
        className="relative py-16 sm:py-20 bg-[#18181B] text-white overflow-hidden mt-8 scroll-mt-20"
      >
        <GradientBackground
          gradientType="radial-gradient"
          gradientOrigin="top-left"
          gradientSize="140% 140%"
          colors={[
            { color: "rgba(45, 34, 28, 0.95)", stop: "0%" },
            { color: "rgba(24, 24, 27, 0.98)", stop: "40%" },
            { color: "rgba(18, 18, 18, 1)", stop: "100%" },
          ]}
          noiseIntensity={0.7}
          noisePatternAlpha={36}
          noisePatternSize={95}
          noisePatternRefreshInterval={0}
        />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Fotos con Estética Polaroid */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[260px] sm:min-h-[300px]">
              <div className="w-36 xs:w-44 sm:w-56 bg-white p-2 sm:p-2.5 pb-4 sm:pb-6 rounded-xl shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-300 border border-stone-200">
                <img
                  src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=450&q=75"
                  alt="Caleta Quidico"
                  width={224}
                  height={176}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-32 sm:h-44 object-cover rounded"
                />
                <p className="mt-2 text-center text-stone-800 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
                  CALETA QUIDICO
                </p>
              </div>

              <div className="w-36 xs:w-44 sm:w-56 bg-white p-2 sm:p-2.5 pb-4 sm:pb-6 rounded-xl shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-300 border border-stone-200 -ml-8 sm:-ml-16 mt-6 sm:mt-10 z-20">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=450&q=75"
                  alt="Gastronomía de Tirúa"
                  width={224}
                  height={176}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-32 sm:h-44 object-cover rounded"
                />
                <p className="mt-2 text-center text-stone-800 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
                  SABORES DE NUESTRA TIERRA
                </p>
              </div>
            </div>

            {/* Narrativa Editorial */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-400">
                GASTRONOMÍA LOCAL CON IDENTIDAD
              </span>
              <TopDownLetters
                as="h2"
                text="SABORES AUTÉNTICOS DE NUESTRA TIERRA Y MAR"
                className="font-display text-3xl sm:text-5xl text-white tracking-wide uppercase leading-tight"
              />
              <p className="font-body text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
                PideTirúa es la vitrina gastronómica comunal que une a los emprendedores de <strong>Tirúa Centro</strong> y la emblemática caleta de <strong>Quidico</strong>. Pescados y mariscos frescos de la costa, pollos asados, papas fritas y recetas familiares preparadas por las manos de nuestra gente.
              </p>
              <p className="font-body text-xs sm:text-sm text-stone-400 leading-relaxed">
                Cada pedido llega directo al WhatsApp de quien cocina, fortaleciendo el comercio local sin cobrar comisiones abusivas.
              </p>

              <div className="pt-2">
                <a
                  href="#directorio-locales"
                  className="inline-flex items-center gap-2 rounded-full bg-[#C2410C] hover:bg-[#9a3412] text-white text-xs font-black uppercase tracking-wider px-6 py-3 transition shadow-lg hover:scale-105 active:scale-95"
                >
                  <span>EXPLORAR RESTAURANTES</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PILARES INFORMATIVOS */}
      <section className="bg-[#EAE6DF] border-y border-stone-300/60 py-10">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-stone-300/40">
              <div className="w-11 h-11 rounded-full bg-orange-100 text-[#C2410C] flex items-center justify-center shrink-0">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <TopDownLetters
                  as="h3"
                  text="RETIRO AL PASO O SERVIRSE EN MESA"
                  className="font-display text-xl text-stone-900 tracking-wide uppercase"
                />
                <p className="font-body text-xs text-stone-600 mt-1 leading-relaxed">
                  <strong>Pide antes de salir (sin delivery):</strong> encarga con anticipación para retirar en mostrador sin filas, o para que tu comida esté servida y lista en tu mesa apenas llegues al local (o pide directo a tu mesa sin esperas).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-stone-300/40">
              <div className="w-11 h-11 rounded-full bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0">
                <Fish className="h-5 w-5" />
              </div>
              <div>
                <TopDownLetters
                  as="h3"
                  text="PRODUCTO 100% LOCAL"
                  className="font-display text-xl text-stone-900 tracking-wide uppercase"
                />
                <p className="font-body text-xs text-stone-600 mt-1 leading-relaxed">
                  Mariscos frescos de caleta Quidico y recetas tradicionales del campo tiruano a tu mesa.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-stone-300/40">
              <div className="w-11 h-11 rounded-full bg-[#0A3656]/10 text-[#0A3656] flex items-center justify-center shrink-0">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <TopDownLetters
                  as="h3"
                  text="¿TIENES UN LOCAL?"
                  className="font-display text-xl text-stone-900 tracking-wide uppercase"
                />
                <p className="font-body text-xs text-stone-600 mt-1 leading-relaxed">
                  Suma tu restaurante a PideTirúa y obtén tu carta digital QR para pedidos en mesa y mostrador.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function HomeFooter({ hasOfertas }: { hasOfertas: boolean }) {
  return (
    <footer className="bg-[#FAF8F5] py-12 text-center text-stone-600">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap justify-center items-center gap-6 text-[11px] font-bold tracking-widest uppercase text-stone-700">
          <a
            href="#directorio-locales"
            title="NUESTROS LOCALES — Directorio gastronómico"
            aria-label="NUESTROS LOCALES — Directorio gastronómico"
            className="hover:text-[#C2410C] transition"
          >
            NUESTROS LOCALES
          </a>
          {hasOfertas && (
            <a
              href="#ofertas-hoy"
              title="OFERTAS DEL DÍA — Promociones gastronómicas"
              aria-label="OFERTAS DEL DÍA — Promociones gastronómicas"
              className="hover:text-[#C2410C] transition"
            >
              OFERTAS DEL DÍA
            </a>
          )}
          <a
            href="#historia-comuna"
            title="SABORES LOCALES — Tradición culinaria de Tirúa"
            aria-label="SABORES LOCALES — Tradición culinaria de Tirúa"
            className="hover:text-[#C2410C] transition"
          >
            SABORES LOCALES
          </a>
          <Link
            href="/superadmin"
            title="PANEL ADMIN — Panel de administración general"
            aria-label="PANEL ADMIN — Panel de administración general"
            className="hover:text-[#C2410C] transition"
          >
            PANEL ADMIN
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2.5">
          <img
            src="/logo-pidetirua.jpg?v=2"
            alt="Logo PideTirúa"
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="w-10 h-10 rounded-full object-contain border border-stone-300 bg-white shadow-xs"
          />
          <span className="font-display text-2xl tracking-wider text-stone-900 uppercase">
            PIDETIRÚA
          </span>
        </div>

        <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
          Plataforma comunal de cartas digitales QR y pedidos anticipados (retiro al paso o para servirse en mesa, sin delivery) para locales gastronómicos de Tirúa y Quidico, Región del Biobío, Chile.
        </p>

        <p className="text-[11px] text-stone-600">
          © {new Date().getFullYear()} PideTirúa. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
