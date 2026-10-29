"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CategoriaFiltro, Local, SectorComuna } from "@/types/local";
import { CATEGORIAS_DIRECTORIO } from "@/lib/locales";
import { formatCLP } from "@/lib/formatters";
import LocalCard from "@/components/LocalCard";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Dices,
  Sparkles,
  Search,
  X,
  Store,
  MapPin,
  Clock,
  UtensilsCrossed,
  Fish,
  QrCode,
} from "lucide-react";
import dynamic from "next/dynamic";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";

const RecomendadorPlatosModal = dynamic(
  () => import("@/components/RecomendadorPlatosModal"),
  { ssr: false }
);

interface DirectoryClientProps {
  locales: Local[];
}

export default function DirectoryClient({ locales }: DirectoryClientProps) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaFiltro>("Todos");
  const [sectorActivo, setSectorActivo] = useState<"Todos" | SectorComuna>("Todos");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [localQrModal, setLocalQrModal] = useState<Local | null>(null);
  const [mostrarRecomendador, setMostrarRecomendador] = useState(false);

  const cantidadAbiertos = useMemo(
    () => locales.filter((l) => l.abierto).length,
    [locales]
  );

  // Platos con Oferta activa del Día
  const ofertasDelDia = useMemo(() => {
    const listado: Array<{
      localSlug: string;
      localNombre: string;
      localLogo: string;
      localAbierto: boolean;
      localHorario: string;
      productoId: string;
      productoNombre: string;
      productoDescripcion: string;
      imagen: string;
      precioOriginal: number;
      precioOferta: number;
      textoPromo: string;
    }> = [];

    locales
      .filter((loc) => loc.activo !== false)
      .forEach((loc) => {
        loc.categorias.forEach((cat) => {
          cat.productos.forEach((p) => {
            if (p.es_oferta && p.disponible !== false) {
              const precioOferta =
                typeof p.precio_oferta === "number" && p.precio_oferta > 0
                  ? p.precio_oferta
                  : p.precio;
              listado.push({
                localSlug: loc.slug,
                localNombre: loc.nombre,
                localLogo: loc.logo_url || loc.logo,
                localAbierto: loc.abierto,
                localHorario: loc.horario || loc.tiempoEstimado,
                productoId: p.id,
                productoNombre: p.nombre,
                productoDescripcion: p.descripcion,
                imagen: p.imagen_url || p.imagen,
                precioOriginal: p.precio,
                precioOferta,
                textoPromo: p.texto_promo || "🔥 Oferta del Día",
              });
            }
          });
        });
      });

    return listado;
  }, [locales]);

  const carruselPromosRef = useRef<HTMLDivElement | null>(null);

  const scrollPromos = (direccion: "izq" | "der") => {
    if (!carruselPromosRef.current) return;
    const scrollAmount = 320;
    carruselPromosRef.current.scrollBy({
      left: direccion === "izq" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Filtrado de locales
  const localesFiltrados = useMemo(() => {
    const rawQuery = busqueda.trim().toLowerCase();
    const filtrarSoloAbiertos =
      soloAbiertos ||
      rawQuery.includes("abierto") ||
      rawQuery.includes("abiertos");
    const query = rawQuery
      .replace(/\babiertos\b/g, "")
      .replace(/\babierto\b/g, "")
      .replace(/\bahora\b/g, "")
      .trim();

    return locales.filter((local) => {
      if (filtrarSoloAbiertos && !local.abierto) return false;

      const coincideCategoria =
        categoriaActiva === "Todos" ||
        local.categoriaFiltro.includes(categoriaActiva);

      const coincideSector =
        sectorActivo === "Todos" || local.sector === sectorActivo;

      if (!coincideCategoria || !coincideSector) return false;
      if (!query) return true;

      const enNombreORubro =
        local.nombre.toLowerCase().includes(query) ||
        local.rubro.toLowerCase().includes(query) ||
        local.ubicacion.toLowerCase().includes(query) ||
        local.descripcionCorta.toLowerCase().includes(query);

      const enProductos = local.categorias.some((cat) =>
        cat.productos.some(
          (prod) =>
            prod.nombre.toLowerCase().includes(query) ||
            prod.descripcion.toLowerCase().includes(query)
        )
      );

      return enNombreORubro || enProductos;
    });
  }, [locales, busqueda, categoriaActiva, sectorActivo, soloAbiertos]);

  const scrollHaciaId = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollADirectorio = () => {
    const el = document.getElementById("directorio-locales");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    categoriaActiva !== "Todos" ||
    sectorActivo !== "Todos" ||
    soloAbiertos;

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5] text-[#18181B] selection:bg-[#EA580C] selection:text-white">
      {/* 1. HEADER EDITORIAL */}
      <header className="sticky top-0 z-50 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo Circular Vintage */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-stone-300 shadow-sm bg-white p-0.5 group-hover:scale-105 transition-transform">
              <img
                src="/logo-pidetirua.jpg"
                alt="PideTirúa"
                width={48}
                height={48}
                decoding="async"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <span className="font-display text-2xl tracking-widest text-[#18181B] uppercase block leading-none">
                PIDETIRÚA
              </span>
              <span className="font-body text-[9px] font-bold uppercase tracking-[0.2em] text-[#EA580C] block mt-0.5">
                SABORES DE NUESTRA TIERRA
              </span>
            </div>
          </Link>

          {/* Menú Superior */}
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="#directorio-locales"
              onClick={scrollHaciaId("directorio-locales")}
              className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#EA580C] transition-colors"
            >
              RESTAURANTES ({locales.length})
            </a>
            {ofertasDelDia.length > 0 && (
              <a
                href="#ofertas-hoy"
                onClick={scrollHaciaId("ofertas-hoy")}
                className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#EA580C] transition-colors flex items-center gap-1.5"
              >
                <span>OFERTAS DEL DÍA</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
              </a>
            )}
            <a
              href="#historia-comuna"
              onClick={scrollHaciaId("historia-comuna")}
              className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#EA580C] transition-colors"
            >
              TIRÚA Y QUIDICO
            </a>
          </nav>

          {/* Acciones Superiores */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarRecomendador(true)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-stone-300 bg-white hover:border-orange-300 hover:bg-orange-50/50 text-stone-800 text-[11px] font-bold uppercase tracking-wider px-2.5 sm:px-3.5 py-2 transition"
              title="¿No sabes qué comer? Descúbrelo con el recomendador"
              aria-label="¿No sabes qué comer? Descúbrelo con el recomendador"
            >
              <Dices className="h-3.5 w-3.5 text-[#EA580C]" />
              <span className="hidden xs:inline">¿Qué comer?</span>
            </button>

            <button
              type="button"
              onClick={scrollADirectorio}
              className="inline-flex min-h-[40px] items-center gap-1.5 sm:gap-2 rounded-full bg-[#EA580C] hover:bg-[#c2410c] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3 sm:px-5 py-2 sm:py-2.5 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Store className="h-3.5 w-3.5" />
              <span>VER LOCALES</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO EDITORIAL LIGERO Y DIRECTO AL GRANO */}
      <section className="relative w-full pt-10 pb-8 sm:pt-14 sm:pb-12 overflow-hidden bg-[#FAF8F5] border-b border-stone-200/80">
        <GradientBackground
          gradientType="radial-gradient"
          gradientOrigin="top-middle"
          gradientSize="140% 120%"
          colors={[
            { color: "rgba(254, 240, 218, 0.7)", stop: "0%" },
            { color: "rgba(254, 215, 170, 0.35)", stop: "30%" },
            { color: "rgba(250, 248, 245, 0.85)", stop: "65%" },
            { color: "rgba(250, 248, 245, 1)", stop: "100%" },
          ]}
          noiseIntensity={0.65}
          noisePatternAlpha={34}
          noisePatternSize={90}
          noisePatternRefreshInterval={0}
        />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Badge Territorial */}
          <div className="inline-flex items-center gap-2 bg-white text-stone-900 border border-stone-200 shadow-xs px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4">
            <UtensilsCrossed className="h-3.5 w-3.5 text-[#EA580C]" />
            <span className="text-[#EA580C]">GASTRONOMÍA LOCAL</span>
            <span className="text-stone-300">•</span>
            <span>TIRÚA CENTRO &amp; QUIDICO</span>
          </div>

          {/* Título Principal */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-[#18181B] tracking-tight uppercase max-w-4xl mx-auto leading-none">
            PIDE DIRECTO A LA COCINA EN NUESTRA COMUNA
          </h1>

          {/* Subtítulo descriptivo sin rodeos */}
          <p className="font-body text-sm sm:text-base text-stone-600 max-w-2xl mx-auto mt-3 leading-relaxed">
            Revisa las cartas digitales de los restaurantes locales, personaliza tus platos y coordina tu retiro en local o consumo en mesa directo por WhatsApp, sin cobros adicionales.
          </p>

          {/* Barra de Búsqueda Integrada */}
          <div className="max-w-2xl mx-auto mt-6">
            <div className="flex items-center rounded-full bg-white shadow-lg border border-stone-200/90 p-1.5 transition-all focus-within:border-[#EA580C] focus-within:ring-2 focus-within:ring-orange-200">
              <div className="pl-3 pr-2 text-stone-400">
                <Search className="h-5 w-5 text-stone-500" />
              </div>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Busca por plato, local o especialidad (ej: completos, mariscos, sushi)..."
                className="w-full bg-transparent text-base sm:text-sm text-stone-900 placeholder:text-stone-400 font-medium focus:outline-none py-2"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="p-2 text-stone-400 hover:text-stone-700 transition"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={scrollADirectorio}
                className="bg-[#18181B] hover:bg-[#EA580C] text-white text-[11px] font-black uppercase tracking-wider px-4 sm:px-6 py-2.5 rounded-full transition-all shrink-0 inline-flex items-center gap-1.5 ml-1"
              >
                <span>BUSCAR</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Micro Pilares de Servicio */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-5 text-[11px] font-bold text-stone-600">
            <span className="flex items-center gap-1.5">
              <span className="text-[#EA580C]">⚡</span> Retiro sin filas en local
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#EA580C]">📲</span> Pedido directo por WhatsApp
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#EA580C]">💳</span> Efectivo o CuentaRUT
            </span>
          </div>
        </div>
      </section>

      {/* 3. OFERTAS DEL DÍA (CARRUSEL HORIZONTAL RÁPIDO) */}
      {ofertasDelDia.length > 0 && (
        <section id="ofertas-hoy" className="py-8 sm:py-10 max-w-[1240px] mx-auto px-4 sm:px-6 border-b border-stone-200/70">
          <div className="flex items-end justify-between gap-3 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                <Flame className="h-3 w-3 fill-red-600 text-red-600" />
                <span>OFERTAS DE HOY</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-stone-900 tracking-wide uppercase mt-1">
                PROMOS DESTACADAS DE LA JORNADA
              </h2>
            </div>

            {ofertasDelDia.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollPromos("izq")}
                  aria-label="Ver ofertas anteriores"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-xs transition hover:bg-stone-100 active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollPromos("der")}
                  aria-label="Ver siguientes ofertas"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-xs transition hover:bg-stone-100 active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={carruselPromosRef}
            className="flex gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
          >
            {ofertasDelDia.map((oferta, idx) => (
              <div
                key={`${oferta.localSlug}-${oferta.productoId}-${idx}`}
                className="group flex w-[260px] sm:w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs transition-all duration-300 hover:shadow-lg hover:border-orange-200"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                  <img
                    src={oferta.imagen}
                    alt={oferta.productoNombre}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="rounded-full bg-[#EA580C] px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                      {oferta.textoPromo}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-1 flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                      {oferta.localNombre}
                    </span>
                    <h3 className="font-display text-lg text-stone-900 tracking-wide uppercase line-clamp-1 mt-0.5">
                      {oferta.productoNombre}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      {oferta.precioOferta < oferta.precioOriginal && (
                        <span className="block text-[10px] font-bold text-stone-400 line-through tabular-nums">
                          {formatCLP(oferta.precioOriginal)}
                        </span>
                      )}
                      <span className="text-sm font-black text-[#EA580C] tabular-nums">
                        {formatCLP(oferta.precioOferta)}
                      </span>
                    </div>

                    <Link
                      href={`/${oferta.localSlug}`}
                      className="rounded-full bg-[#18181B] hover:bg-[#EA580C] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 transition shadow-xs"
                    >
                      PEDIR
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. DIRECTORIO PRINCIPAL DE LOCALES (EN PRIMER PLANO VISUAL) */}
      <section
        id="directorio-locales"
        className="py-10 sm:py-14 max-w-[1240px] mx-auto px-4 sm:px-6 space-y-6 scroll-mt-24"
      >
        {/* Cabecera del Directorio y Filtros */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-[#18181B]">
                RESTAURANTES Y PICADAS
              </h2>
              <span className="tabular-nums rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-black text-stone-800">
                {localesFiltrados.length}
              </span>
            </div>
            <p className="font-body text-xs sm:text-sm text-stone-600 mt-1">
              Selecciona un local para revisar su carta completa y hacer tu pedido con retiro en local o consumo en mesa.
            </p>
          </div>

          {/* Controles y Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            {/* Toggle Abiertos Ahora */}
            <button
              type="button"
              onClick={() => setSoloAbiertos((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs ${
                soloAbiertos
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                  : "bg-white border border-stone-300 text-stone-700 hover:border-emerald-500 hover:text-emerald-700"
              }`}
              title="Mostrar únicamente locales que están abiertos recibiendo pedidos ahora"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  soloAbiertos ? "bg-white animate-pulse" : "bg-emerald-500"
                }`}
              />
              <span>
                Abiertos Ahora (<span className="tabular-nums">{cantidadAbiertos}</span>)
              </span>
            </button>

            {/* Filtro por Sector Territorial (Píldoras Segmentadas) */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-stone-200/80 border border-stone-300/60">
              {(["Todos", "Tirúa Centro", "Quidico"] as const).map((sec) => {
                const activo = sectorActivo === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSectorActivo(sec)}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                      activo
                        ? "bg-[#18181B] text-white shadow-xs"
                        : "text-stone-700 hover:text-black"
                    }`}
                  >
                    {sec === "Todos" ? "Toda la Comuna" : sec}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pestañas Horizontales de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIAS_DIRECTORIO.map((cat) => {
            const activa = categoriaActiva === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaActiva(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activa
                    ? "bg-[#EA580C] text-white shadow-xs"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-stone-400"
                }`}
              >
                {cat}
              </button>
            );
          })}

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setCategoriaActiva("Todos");
                setSectorActivo("Todos");
                setSoloAbiertos(false);
              }}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold text-stone-500 hover:text-[#EA580C] hover:bg-orange-50 transition whitespace-nowrap flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Grid de Tarjetas de Locales */}
        {localesFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {localesFiltrados.map((local) => (
              <LocalCard
                key={local.id}
                local={local}
                onOpenQr={(loc) => setLocalQrModal(loc)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-md mx-auto my-6">
            <UtensilsCrossed className="mx-auto h-10 w-10 text-stone-400" />
            <h3 className="mt-3 font-display text-2xl text-stone-900 tracking-wide uppercase">
              NO ENCONTRAMOS RESULTADOS
            </h3>
            <p className="mt-1 font-body text-xs text-stone-600">
              No hay locales que coincidan con tu búsqueda o filtros actuales.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setCategoriaActiva("Todos");
                setSectorActivo("Todos");
                setSoloAbiertos(false);
              }}
              className="mt-4 rounded-full bg-[#18181B] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 hover:bg-[#EA580C] transition"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </section>

      {/* 5. BANNER COMPACTO: RECOMENDADOR DE PLATOS */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 my-6 sm:my-8">
        <button
          type="button"
          onClick={() => setMostrarRecomendador(true)}
          className="group relative w-full overflow-hidden rounded-3xl border border-stone-300 bg-white p-5 sm:p-6 text-left shadow-xs transition-all duration-300 hover:shadow-md hover:border-orange-300"
        >
          <GradientBackground
            gradientType="linear-gradient"
            gradientOrigin="left-middle"
            colors={[
              { color: "rgba(255, 247, 237, 0.95)", stop: "0%" },
              { color: "rgba(254, 237, 213, 0.75)", stop: "35%" },
              { color: "rgba(254, 243, 199, 0.6)", stop: "70%" },
              { color: "rgba(255, 255, 255, 0.95)", stop: "100%" },
            ]}
            noiseIntensity={0.6}
            noisePatternAlpha={34}
            noisePatternSize={85}
            noisePatternRefreshInterval={0}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#EA580C] group-hover:rotate-12 transition-transform duration-300">
                <Dices className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#EA580C]">
                  <Sparkles className="h-3 w-3" />
                  RECOMENDADOR DE PLATOS
                </span>
                <h3 className="mt-1 font-display text-2xl sm:text-3xl tracking-wide text-stone-900">
                  ¿NO SABES QUÉ PEDIR HOY? DESCÚBRELO EN 2 TOQUES
                </h3>
                <p className="text-xs sm:text-sm font-medium text-stone-600">
                  Elige con quién comes y tu antojo del momento. Te sugerimos los 3 mejores platos al instante.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#18181B] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-xs group-hover:bg-[#EA580C] transition-colors">
              <span>PROBAR RECOMENDADOR</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </button>
      </div>

      {/* 6. IDENTIDAD TERRITORIAL: TIRÚA Y CALETA QUIDICO */}
      <section id="historia-comuna" className="relative py-16 sm:py-20 bg-[#18181B] text-white overflow-hidden mt-8">
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
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[300px]">
              <div className="w-48 sm:w-56 bg-white p-2.5 pb-6 rounded-xl shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-300 border border-stone-200">
                <img
                  src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=85"
                  alt="Caleta Quidico"
                  className="w-full h-36 sm:h-44 object-cover rounded"
                />
                <p className="mt-2 text-center text-stone-800 text-[10px] font-bold tracking-widest uppercase">
                  CALETA QUIDICO
                </p>
              </div>

              <div className="w-48 sm:w-56 bg-white p-2.5 pb-6 rounded-xl shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-300 border border-stone-200 -ml-12 sm:-ml-16 mt-10 z-20">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=85"
                  alt="Gastronomía de Tirúa"
                  className="w-full h-36 sm:h-44 object-cover rounded"
                />
                <p className="mt-2 text-center text-stone-800 text-[10px] font-bold tracking-widest uppercase">
                  SABORES DE NUESTRA TIERRA
                </p>
              </div>
            </div>

            {/* Narrativa Editorial */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#EA580C]">
                GASTRONOMÍA LOCAL CON IDENTIDAD
              </span>
              <h2 className="font-display text-3xl sm:text-5xl text-white tracking-wide uppercase leading-tight">
                SABORES AUTÉNTICOS DE NUESTRA TIERRA Y MAR
              </h2>
              <p className="font-body text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
                PideTirúa es la vitrina gastronómica comunal que une a los emprendedores de <strong>Tirúa Centro</strong> y la emblemática caleta de <strong>Quidico</strong>. Pescados y mariscos frescos de la costa, pollos asados, papas fritas y recetas familiares preparadas por las manos de nuestra gente.
              </p>
              <p className="font-body text-xs sm:text-sm text-stone-400 leading-relaxed">
                Cada pedido llega directo al WhatsApp de quien cocina, fortaleciendo el comercio local sin cobrar comisiones abusivas.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={scrollADirectorio}
                  className="inline-flex items-center gap-2 rounded-full bg-[#EA580C] hover:bg-[#c2410c] text-white text-xs font-black uppercase tracking-wider px-6 py-3 transition shadow-lg hover:scale-105 active:scale-95"
                >
                  <span>EXPLORAR RESTAURANTES</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
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
              <div className="w-11 h-11 rounded-full bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center shrink-0">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl text-stone-900 tracking-wide uppercase">
                  RETIRO EN LOCAL Y EN MESA
                </h3>
                <p className="font-body text-xs text-stone-600 mt-1 leading-relaxed">
                  Pide con anticipación desde tu celular y retira tu comida caliente y lista sin filas en el mostrador.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-stone-300/40">
              <div className="w-11 h-11 rounded-full bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0">
                <Fish className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl text-stone-900 tracking-wide uppercase">
                  PRODUCTO 100% LOCAL
                </h3>
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
                <h3 className="font-display text-xl text-stone-900 tracking-wide uppercase">
                  ¿TIENES UN LOCAL?
                </h3>
                <p className="font-body text-xs text-stone-600 mt-1 leading-relaxed">
                  Suma tu restaurante a PideTirúa y obtén tu carta digital QR para pedidos en mesa y mostrador.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER ARTESANAL */}
      <footer className="bg-[#FAF8F5] py-12 text-center text-stone-600">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-wrap justify-center items-center gap-6 text-[11px] font-bold tracking-widest uppercase text-stone-700">
            <a
              href="#directorio-locales"
              onClick={scrollHaciaId("directorio-locales")}
              className="hover:text-[#EA580C] transition"
            >
              NUESTROS LOCALES
            </a>
            {ofertasDelDia.length > 0 && (
              <a
                href="#ofertas-hoy"
                onClick={scrollHaciaId("ofertas-hoy")}
                className="hover:text-[#EA580C] transition"
              >
                OFERTAS DEL DÍA
              </a>
            )}
            <a
              href="#historia-comuna"
              onClick={scrollHaciaId("historia-comuna")}
              className="hover:text-[#EA580C] transition"
            >
              SABORES LOCALES
            </a>
            <Link href="/superadmin" className="hover:text-[#EA580C] transition">
              PANEL ADMIN
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <img
              src="/logo-pidetirua.jpg"
              alt="Logo PideTirúa"
              className="w-10 h-10 rounded-full object-contain border border-stone-300 bg-white shadow-xs"
            />
            <span className="font-display text-2xl tracking-wider text-stone-900 uppercase">
              PIDETIRÚA
            </span>
          </div>

          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            Plataforma comunal de cartas digitales QR y pedidos con retiro en local y en mesa para locales gastronómicos de Tirúa y Quidico, Región del Biobío, Chile.
          </p>

          <p className="text-[11px] text-stone-400">
            © {new Date().getFullYear()} PideTirúa. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Modal de Código QR por Local */}
      {localQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setLocalQrModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-[#EA580C] uppercase tracking-wider">
                  <QrCode className="h-3 w-3" />
                  MENÚ QR EXCLUSIVO
                </span>
                <h3 className="mt-1 font-display text-2xl text-stone-900 tracking-wide uppercase">
                  {localQrModal.nombre}
                </h3>
                <p className="text-xs text-stone-500">{localQrModal.ubicacion}</p>
              </div>
              <button
                type="button"
                onClick={() => setLocalQrModal(null)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `https://pidetirua.cl/${localQrModal.slug}`
                )}`}
                alt={`QR ${localQrModal.nombre}`}
                width={176}
                height={176}
                loading="lazy"
                decoding="async"
                className="h-44 w-44 rounded-xl bg-white p-2 shadow-sm"
              />
              <code className="mt-3 rounded-full bg-stone-200 px-3 py-0.5 text-xs font-bold text-stone-800">
                /{localQrModal.slug}
              </code>
              <p className="mt-2 text-center text-xs text-stone-500 leading-relaxed">
                Escanea este QR en mesa o mostrador para abrir el menú móvil de{" "}
                <strong>{localQrModal.nombre}</strong>.
              </p>
            </div>

            <Link
              href={`/${localQrModal.slug}`}
              onClick={() => setLocalQrModal(null)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#EA580C] px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-[#c2410c] transition"
            >
              <span>IR AL MENÚ MÓVIL</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Modal interactivo de recomendación de platos */}
      <RecomendadorPlatosModal
        isOpen={mostrarRecomendador}
        onClose={() => setMostrarRecomendador(false)}
        locales={locales}
      />
    </div>
  );
}
