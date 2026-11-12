"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CategoriaFiltro,
  CATEGORIAS_DIRECTORIO,
  Local,
  SectorComuna,
} from "@/types/local";
import {
  esOfertaValidaHoy,
  formatCLP,
  getFechaHoyChile,
} from "@/lib/formatters";
import LocalCard from "@/components/LocalCard";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Flame,
  Dices,
  Sparkles,
  Search,
  X,
  Store,
  MapPin,
  Clock,
  UtensilsCrossed,
  QrCode,
} from "lucide-react";
import dynamic from "next/dynamic";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";
import { TopDownLetters } from "@/components/ui/top-down-letters";

const RecomendadorPlatosModal = dynamic(
  () => import("@/components/RecomendadorPlatosModal"),
  { ssr: false }
);

const ICONOS_CATEGORIA: Record<CategoriaFiltro, string> = {
  Todos: "🍽️",
  Sushi: "🍣",
  "Comida Rápida": "🍔",
  "Pescados y Mariscos": "🐟",
  Cafetería: "☕",
};

interface DirectoryClientProps {
  locales: Local[];
  editorialContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export default function DirectoryClient({
  locales,
  editorialContent,
  footerContent,
}: DirectoryClientProps) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaFiltro>("Todos");
  const [sectorActivo, setSectorActivo] = useState<"Todos" | SectorComuna>("Todos");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [localQrModal, setLocalQrModal] = useState<Local | null>(null);
  const [mostrarRecomendador, setMostrarRecomendador] = useState(false);
  const [fotoHeroIndex, setFotoHeroIndex] = useState(0);
  const [heroCarouselReady, setHeroCarouselReady] = useState(false);

  // Selección dinámica de fotos del Hero determinista según fecha chilena
  const fotosHero = useMemo(() => {
    const fechaChile = getFechaHoyChile();
    const [anio, mes, dia] = fechaChile.split("-").map(Number);
    const diaDelAnio = (anio || 2026) * 366 + (mes || 1) * 31 + (dia || 1);

    const items: Array<{
      localSlug: string;
      nombreLocal: string;
      plato: string;
      icono: string;
      url: string;
      alt: string;
    }> = [];

    locales
      .filter((loc) => loc.activo !== false)
      .forEach((loc, localIdx) => {
        const platosConFoto: Array<{ nombre: string; url: string }> = [];

        (loc.categorias || []).forEach((cat) => {
          if (cat.activa === false) return;
          (cat.productos || []).forEach((p) => {
            const img = p.imagen_url || p.imagen;
            if (img && img.trim() && p.disponible !== false) {
              platosConFoto.push({ nombre: p.nombre, url: img.trim() });
            }
          });
        });

        const primerRubro = loc.categoriaFiltro?.[0] as CategoriaFiltro;
        const icono = ICONOS_CATEGORIA[primerRubro] || "🍴";

        if (platosConFoto.length > 0) {
          // Elige un plato distinto cada día de forma automática
          const platoHoy =
            platosConFoto[(diaDelAnio + localIdx) % platosConFoto.length];
          items.push({
            localSlug: loc.slug,
            nombreLocal: loc.nombre,
            plato: platoHoy.nombre,
            icono,
            url: platoHoy.url,
            alt: `${platoHoy.nombre} en ${loc.nombre}`,
          });
        } else if (loc.banner_url || loc.fotoPortada) {
          const portada = (loc.banner_url || loc.fotoPortada)!;
          items.push({
            localSlug: loc.slug,
            nombreLocal: loc.nombre,
            plato: loc.rubro || "Gastronomía Local",
            icono,
            url: portada,
            alt: `${loc.nombre} en Tirúa`,
          });
        }
      });

    return items;
  }, [locales]);

  const activeHeroIndex =
    fotosHero.length > 0 ? fotoHeroIndex % fotosHero.length : 0;

  useEffect(() => {
    setFotoHeroIndex(0);
  }, [fotosHero.length]);

  // Rotación automática suave del carrusel de fotos del hero cada 5.5s
  useEffect(() => {
    if (fotosHero.length <= 1) return;
    const timer = setInterval(() => {
      setHeroCarouselReady(true);
      setFotoHeroIndex((prev) => (prev + 1) % fotosHero.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [fotosHero.length]);

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
        (loc.categorias || []).forEach((cat) => {
          if (cat.activa === false) return;
          (cat.productos || []).forEach((p) => {
            if (esOfertaValidaHoy(p)) {
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
                productoDescripcion: p.descripcion || "",
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
        (local.categoriaFiltro || []).includes(categoriaActiva);

      const coincideSector =
        sectorActivo === "Todos" || local.sector === sectorActivo;

      if (!coincideCategoria || !coincideSector) return false;
      if (!query) return true;

      const enNombreORubro =
        (local.nombre || "").toLowerCase().includes(query) ||
        (local.rubro || "").toLowerCase().includes(query) ||
        (local.ubicacion || "").toLowerCase().includes(query) ||
        (local.descripcionCorta || "").toLowerCase().includes(query);

      const enProductos = (local.categorias || []).some((cat) =>
        (cat.productos || []).some(
          (prod) =>
            (prod.nombre || "").toLowerCase().includes(query) ||
            (prod.descripcion || "").toLowerCase().includes(query)
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
    <div className="relative min-h-screen w-full max-w-full overflow-x-clip bg-[#FAF8F5] text-[#18181B] selection:bg-[#EA580C] selection:text-white">
      {/* 1. HEADER EDITORIAL */}
      <header className="sticky top-0 z-50 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-[1240px] mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo Circular Vintage */}
          <Link
            href="/"
            title="PIDETIRÚA — Sabores de nuestra tierra"
            aria-label="PIDETIRÚA — Sabores de nuestra tierra"
            className="flex items-center gap-2 sm:gap-3 min-w-0 shrink group"
          >
            <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-stone-300 shadow-sm bg-white p-0.5 group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/logo-pidetirua.jpg?v=2"
                alt="PideTirúa"
                width={48}
                height={48}
                decoding="async"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0">
              <span className="font-display text-xl sm:text-2xl tracking-widest text-[#18181B] uppercase block leading-none">
                PIDETIRÚA
              </span>
              <span className="font-body text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-[0.2em] text-[#C2410C] block mt-0.5 truncate max-w-[130px] xs:max-w-none">
                SABORES DE NUESTRA TIERRA
              </span>
            </div>
          </Link>

          {/* Menú Superior */}
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="#directorio-locales"
              title={`RESTAURANTES (${locales.length}) — Directorio gastronómico`}
              aria-label={`RESTAURANTES (${locales.length}) — Directorio gastronómico`}
              onClick={scrollHaciaId("directorio-locales")}
              className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#C2410C] transition-colors"
            >
              RESTAURANTES ({locales.length})
            </a>
            {ofertasDelDia.length > 0 && (
              <a
                href="#ofertas-hoy"
                title="OFERTAS DEL DÍA — Promociones gastronómicas activas"
                aria-label="OFERTAS DEL DÍA — Promociones gastronómicas activas"
                onClick={scrollHaciaId("ofertas-hoy")}
                className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#C2410C] transition-colors flex items-center gap-1.5"
              >
                <span>OFERTAS DEL DÍA</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
              </a>
            )}
            <a
              href="#historia-comuna"
              title="TIRÚA Y QUIDICO — Conocer sabores locales y territorio"
              aria-label="TIRÚA Y QUIDICO — Conocer sabores locales y territorio"
              onClick={scrollHaciaId("historia-comuna")}
              className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#C2410C] transition-colors"
            >
              TIRÚA Y QUIDICO
            </a>
          </nav>

          {/* Acciones Superiores */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMostrarRecomendador(true)}
              className="inline-flex min-h-[38px] sm:min-h-[40px] items-center gap-1.5 rounded-full border border-stone-300 bg-white hover:border-orange-300 hover:bg-orange-50/50 text-stone-800 text-[11px] font-bold uppercase tracking-wider px-2.5 sm:px-3.5 py-1.5 sm:py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] shrink-0"
              title="¿Qué comer? — Recomendador de platos"
              aria-label="¿Qué comer? — Recomendador de platos"
            >
              <Dices className="h-3.5 w-3.5 text-[#C2410C] shrink-0" />
              <span className="hidden sm:inline">¿Qué comer?</span>
            </button>

            <button
              type="button"
              onClick={scrollADirectorio}
              className="inline-flex min-h-[38px] sm:min-h-[40px] items-center gap-1.5 sm:gap-2 rounded-full bg-[#C2410C] hover:bg-[#9a3412] text-white text-[11px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest px-2.5 sm:px-5 py-1.5 sm:py-2.5 shadow-sm transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] shrink-0"
            >
              <Store className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">VER </span>
              <span>LOCALES</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* 2. HERO PRINCIPAL GASTRONÓMICO CON FOTO SANGRADA (OPCIÓN 3) */}
        <section className="relative w-full min-h-[480px] sm:min-h-[440px] pt-10 pb-10 sm:pt-16 sm:pb-16 overflow-hidden bg-[#FAF8F5] border-b border-stone-200/80">
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

          {/* Fondo visual sangrado: carrusel de locales activos o logo oficial de PideTirúa de fondo */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full lg:w-7/12 overflow-hidden pointer-events-none z-0 opacity-40 lg:opacity-100 transition-opacity duration-700"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 15%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.9) 75%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 15%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.9) 75%, black 100%)",
            }}
          >
            {fotosHero.length > 0 ? (
              fotosHero.map((foto, idx) =>
                idx === activeHeroIndex || heroCarouselReady ? (
                  <img
                    key={`${foto.localSlug}-${foto.url}`}
                    src={foto.url}
                    alt={foto.alt}
                    loading={idx === 0 ? "eager" : "lazy"}
                    // @ts-ignore
                    fetchPriority={idx === 0 ? "high" : "auto"}
                    decoding={idx === 0 ? "sync" : "async"}
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
                      idx === activeHeroIndex
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-105"
                    }`}
                  />
                ) : null
              )
            ) : (
              <img
                src="/og-image.jpg"
                alt="Logo oficial PideTirúa"
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
                decoding="sync"
                className="absolute inset-0 h-full w-full object-cover object-center mix-blend-multiply"
              />
            )}
            {/* Suave degradado vertical en la parte inferior para fundir con la división de sección */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FAF8F5] to-transparent opacity-80" />
          </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-2xl lg:max-w-xl text-left">
            {/* Badge Territorial */}
            <div className="inline-flex items-center gap-2 bg-white text-stone-900 border border-stone-200 shadow-xs px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4">
              <UtensilsCrossed className="h-3.5 w-3.5 text-[#C2410C]" />
              <span className="text-[#C2410C]">GASTRONOMÍA LOCAL</span>
              <span className="text-stone-300">•</span>
              <span>TIRÚA CENTRO &amp; QUIDICO</span>
            </div>

            {/* Título Principal */}
            <TopDownLetters
              as="h1"
              text="PIDE DIRECTO A LA COCINA EN NUESTRA COMUNA"
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#18181B] tracking-tight uppercase leading-none"
            />

            {/* Subtítulo descriptivo sin rodeos */}
            <p className="font-body text-sm sm:text-base text-stone-600 mt-3.5 leading-relaxed max-w-xl">
              Revisa las cartas digitales de restaurantes y cafeterías de Tirúa. Pide antes de salir y elige: retiro al paso en mostrador sin filas o comida caliente servida en mesa al llegar, coordinado directo por WhatsApp sin intermediarios ni delivery.
            </p>

            {/* Barra de Búsqueda Integrada */}
            <div className="max-w-xl mt-6">
              <div className="flex items-center rounded-full bg-white shadow-lg border border-stone-200/90 p-1.5 transition-all focus-within:border-[#EA580C] focus-within:ring-2 focus-within:ring-orange-200">
                <div className="pl-3 pr-2 text-stone-400">
                  <Search className="h-5 w-5 text-stone-500" />
                </div>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Busca café latte, pastelería, mariscos, sushi, completos..."
                  className="min-w-0 flex-1 w-full bg-transparent text-base sm:text-sm text-stone-900 placeholder:text-stone-400 font-medium focus:outline-none py-2"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    className="p-2 text-stone-400 hover:text-stone-700 transition shrink-0"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={scrollADirectorio}
                  className="bg-[#18181B] hover:bg-[#EA580C] text-white text-[11px] font-black uppercase tracking-wider px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all shrink-0 inline-flex items-center gap-1.5 ml-1"
                >
                  <span>BUSCAR</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Micro Pilares de Servicio */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-[11px] font-bold text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="text-[#C2410C]">⚡</span> Retiro sin filas en local
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#C2410C]">📲</span> Pedido directo por WhatsApp
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#C2410C]">💳</span> Efectivo o CuentaRUT
              </span>
            </div>

            {/* Selector de Fotos de Locales Activos (1-clic y auto-rotación) */}
            {fotosHero.length > 0 ? (
              <div className="mt-5 pt-3 border-t border-stone-200/60 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EA580C] animate-pulse"></span>
                  <span>En imagen:</span>
                  <strong className="text-stone-900 font-bold truncate max-w-[180px] sm:max-w-none">
                    {fotosHero[activeHeroIndex]?.plato || "Especialidad Local"}
                  </strong>
                  <span className="text-stone-300">·</span>
                </span>
                {fotosHero.map((f, idx) => {
                  const activa = idx === activeHeroIndex;
                  return (
                    <button
                      key={`${f.localSlug}-${idx}`}
                      type="button"
                      onClick={() => {
                        setHeroCarouselReady(true);
                        setFotoHeroIndex(idx);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                        activa
                          ? "bg-[#18181B] text-white shadow-xs"
                          : "bg-white/80 hover:bg-white text-stone-700 border border-stone-200/80"
                      }`}
                    >
                      <span>{f.icono}</span>
                      <span>{f.nombreLocal.replace(" Tirúa", "").replace(" Quidico", "")}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 pt-3 border-t border-stone-200/60 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>PideTirúa · Cartas digitales activándose próximamente</span>
                </span>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 3. OFERTAS DEL DÍA (CARRUSEL HORIZONTAL RÁPIDO) */}
      {ofertasDelDia.length > 0 && (
        <section
          id="ofertas-hoy"
          className="py-8 sm:py-10 max-w-[1240px] mx-auto px-4 sm:px-6 border-b border-stone-200/70 scroll-mt-24"
        >
          <div className="flex items-end justify-between gap-3 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider">
                <Flame className="h-3 w-3 fill-red-600 text-red-600" />
                <span>OFERTAS DE HOY</span>
              </div>
              <TopDownLetters
                as="h2"
                text="PROMOS DESTACADAS DE LA JORNADA"
                className="font-display text-2xl sm:text-3xl text-stone-900 tracking-wide uppercase mt-1"
              />
            </div>

            {ofertasDelDia.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollPromos("izq")}
                  aria-label="Ver ofertas anteriores"
                  className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-xs transition hover:bg-stone-100 active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollPromos("der")}
                  aria-label="Ver siguientes ofertas"
                  className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-xs transition hover:bg-stone-100 active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" />
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
                    <span className="rounded-full bg-[#C2410C] px-2.5 py-0.5 text-[11px] font-black text-white uppercase tracking-wider shadow-sm">
                      {oferta.textoPromo}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-1 flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                      {oferta.localNombre}
                    </span>
                    <h3 className="font-display text-lg text-stone-900 tracking-wide uppercase line-clamp-1 mt-0.5">
                      {oferta.productoNombre}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      {oferta.precioOferta < oferta.precioOriginal && (
                        <span className="block text-xs font-bold text-stone-500 line-through tabular-nums">
                          {formatCLP(oferta.precioOriginal)}
                        </span>
                      )}
                      <span className="text-sm font-black text-[#C2410C] tabular-nums">
                        {formatCLP(oferta.precioOferta)}
                      </span>
                    </div>

                    <Link
                      href={`/${oferta.localSlug}`}
                      title={`Pedir oferta en ${oferta.localNombre}`}
                      aria-label={`Pedir oferta en ${oferta.localNombre}`}
                      className="inline-flex min-h-[36px] items-center justify-center rounded-full bg-[#18181B] hover:bg-[#EA580C] text-white text-xs font-black uppercase tracking-wider px-4 py-2 transition shadow-xs active:scale-95"
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
              <TopDownLetters
                as="h2"
                text="RESTAURANTES, CAFÉS Y PICADAS"
                className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-[#18181B]"
              />
              <span className="tabular-nums rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-black text-stone-800">
                {localesFiltrados.length}
              </span>
            </div>
            <p className="font-body text-xs sm:text-sm text-stone-600 mt-1">
              Selecciona un local para revisar su carta completa y hacer tu pedido anticipado: para retirar al paso o para llegar y servirte directo en mesa.
            </p>
          </div>

          {/* Controles y Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto max-w-full">
            {/* Toggle Abiertos Ahora */}
            <button
              type="button"
              onClick={() => setSoloAbiertos((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs shrink-0 ${
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
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-stone-200/80 border border-stone-300/60 max-w-full overflow-x-auto no-scrollbar">
              {(["Todos", "Tirúa Centro", "Quidico"] as const).map((sec) => {
                const activo = sectorActivo === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSectorActivo(sec)}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 ${
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

        {/* 1. Selector Desplegable en Móvil (Visible solo en smartphones) */}
        <div className="sm:hidden w-full">
          <label htmlFor="categoria-select-mobile" className="sr-only">
            Filtrar por Categoría
          </label>
          <div className="relative">
            <select
              id="categoria-select-mobile"
              value={categoriaActiva}
              onChange={(e) => setCategoriaActiva(e.target.value as CategoriaFiltro)}
              className="w-full appearance-none rounded-2xl border-2 border-[#EA580C]/40 bg-white py-3 pl-4 pr-10 text-xs font-black uppercase tracking-wider text-stone-900 shadow-xs focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
            >
              {CATEGORIAS_DIRECTORIO.map((cat) => (
                <option key={cat} value={cat} className="py-2 text-stone-900 font-bold">
                  {ICONOS_CATEGORIA[cat] || "🍴"} {cat === "Todos" ? "Todas las Categorías" : cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#EA580C]">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
          {hayFiltrosActivos && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setCategoriaActiva("Todos");
                  setSectorActivo("Todos");
                  setSoloAbiertos(false);
                }}
                className="text-[11px] font-bold text-stone-500 hover:text-[#EA580C] flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                <span>Limpiar filtros</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Pestañas Horizontales en Tablet y Escritorio (sm:flex) */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIAS_DIRECTORIO.map((cat) => {
            const activa = categoriaActiva === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaActiva(cat)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activa
                    ? "bg-[#C2410C] text-white shadow-xs"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-stone-400"
                }`}
              >
                <span>{ICONOS_CATEGORIA[cat] || "🍴"}</span>
                <span>{cat}</span>
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
              className="px-3 py-1.5 rounded-full text-[11px] font-bold text-stone-500 hover:text-[#C2410C] hover:bg-orange-50 transition whitespace-nowrap flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]"
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
              {locales.length === 0
                ? "LOCALES ACTUALIZANDO CARTA"
                : "NO ENCONTRAMOS RESULTADOS"}
            </h3>
            <p className="mt-1 font-body text-xs text-stone-600">
              {locales.length === 0
                ? "En este momento no hay locales activos publicados en el directorio. Vuelve en unos minutos."
                : "No hay locales que coincidan con tu búsqueda o filtros actuales."}
            </p>
            {locales.length > 0 && (
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
            )}
          </div>
        )}
      </section>

      {/* 5. BANNER COMPACTO: RECOMENDADOR DE PLATOS */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 my-6 sm:my-8">
        <div
          role="button"
          tabIndex={0}
          aria-label="Abrir recomendador de platos: ¿No sabes qué pedir hoy? Descúbrelo en 2 toques"
          onClick={() => setMostrarRecomendador(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setMostrarRecomendador(true);
            }
          }}
          className="group relative w-full overflow-hidden rounded-3xl border border-stone-300 bg-white p-5 sm:p-6 text-left shadow-xs transition-all duration-300 hover:shadow-md hover:border-orange-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]"
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#C2410C] group-hover:rotate-12 transition-transform duration-300">
                <Dices className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#C2410C]">
                  <Sparkles className="h-3 w-3" />
                  RECOMENDADOR DE PLATOS
                </span>
                <TopDownLetters
                  as="h3"
                  text="¿NO SABES QUÉ PEDIR HOY? DESCÚBRELO EN 2 TOQUES"
                  className="mt-1 font-display text-2xl sm:text-3xl tracking-wide text-stone-900"
                />
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
        </div>
      </div>

        {editorialContent}
      </main>

      {footerContent}

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
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-[#C2410C] uppercase tracking-wider">
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
                  `https://www.pidetirua.cl/${localQrModal.slug}`
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
              title={`ABRIR CARTA DIGITAL — ${localQrModal.nombre}`}
              aria-label={`ABRIR CARTA DIGITAL — ${localQrModal.nombre}`}
              onClick={() => setLocalQrModal(null)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C2410C] px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-[#9a3412] transition"
            >
              <span>IR AL MENÚ MÓVIL</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Modal interactivo de recomendación de platos (cargado bajo demanda al hacer clic) */}
      {mostrarRecomendador && (
        <RecomendadorPlatosModal
          isOpen={mostrarRecomendador}
          onClose={() => setMostrarRecomendador(false)}
          locales={locales}
        />
      )}
    </div>
  );
}
