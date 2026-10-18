"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CategoriaFiltro, Local, SectorComuna } from "@/types/local";
import { CATEGORIAS_DIRECTORIO } from "@/lib/locales";
import { formatCLP } from "@/lib/formatters";
import { getVideoPoster } from "@/lib/localTheme";
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
  Phone,
  MapPin,
  Clock,
  Store,
} from "lucide-react";
import RecomendadorPlatosModal from "@/components/RecomendadorPlatosModal";

interface DirectoryClientProps {
  locales: Local[];
}

export default function DirectoryClient({ locales }: DirectoryClientProps) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaFiltro>("Todos");
  const [sectorActivo, setSectorActivo] = useState<"Todos" | SectorComuna>("Todos");
  const [localQrModal, setLocalQrModal] = useState<Local | null>(null);
  const [mostrarRecomendador, setMostrarRecomendador] = useState(false);
  const [indiceStepperLocal, setIndiceStepperLocal] = useState(0);

  // Platos Destacados para la Vitrina Radial Central del Hero
  const platosHero = useMemo(() => {
    const listado: Array<{
      id: string;
      nombre: string;
      localNombre: string;
      localSlug: string;
      ubicacion: string;
      precio: number;
      imagen: string;
      descripcion: string;
      tiempoEstimado: string;
      categoria: string;
    }> = [];

    locales.forEach((loc) => {
      loc.categorias.forEach((cat) => {
        cat.productos.forEach((p) => {
          if (p.disponible !== false) {
            listado.push({
              id: p.id,
              nombre: p.nombre,
              localNombre: loc.nombre,
              localSlug: loc.slug,
              ubicacion: loc.ubicacion,
              precio: p.precio,
              imagen: p.imagen_url || p.imagen,
              descripcion: p.descripcion,
              tiempoEstimado: loc.tiempoEstimado,
              categoria: cat.nombre,
            });
          }
        });
      });
    });

    return listado.slice(0, 8);
  }, [locales]);

  const [indicePlatoHero, setIndicePlatoHero] = useState(0);
  const [tamanoHeroActivo, setTamanoHeroActivo] = useState<"TODOS" | "POLLOS" | "SUSHI" | "MARISCOS" | "BURGERS">("TODOS");

  const platoActualHero = platosHero[indicePlatoHero] || platosHero[0];

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

  // Estado y lógica del Coverflow 3D de Locales
  const [indiceCoverflow, setIndiceCoverflow] = useState(0);
  const [pausaCoverflow, setPausaCoverflow] = useState(false);
  const [esPantallaMovil, setEsPantallaMovil] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    const checkViewport = () => {
      setEsPantallaMovil(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  useEffect(() => {
    if (pausaCoverflow || locales.length <= 1) return;
    const timer = setInterval(() => {
      setIndiceCoverflow((prev) => (prev + 1) % locales.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [pausaCoverflow, locales.length]);

  const obtenerEstiloCoverflow = (idx: number) => {
    const total = locales.length;
    let offset = idx - indiceCoverflow;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    if (offset === 0) {
      return {
        estilo: {
          transform: "translate3d(0px, 0px, 0px) rotateY(0deg) scale(1)",
          zIndex: 30,
          opacity: 1,
          boxShadow:
            "0 25px 50px -12px rgba(234, 88, 12, 0.4), 0 0 0 2px rgba(255,255,255,0.9)",
        },
        nivelOscurecimiento: "opacity-0",
      };
    } else if (offset === 1) {
      const tx = esPantallaMovil ? 165 : 265;
      return {
        estilo: {
          transform: `translate3d(${tx}px, 0px, -110px) rotateY(-24deg) scale(0.86)`,
          zIndex: 20,
          opacity: 0.92,
          boxShadow: "0 20px 35px -10px rgba(0,0,0,0.35)",
        },
        nivelOscurecimiento: "opacity-25",
      };
    } else if (offset === -1) {
      const tx = esPantallaMovil ? -165 : -265;
      return {
        estilo: {
          transform: `translate3d(${tx}px, 0px, -110px) rotateY(24deg) scale(0.86)`,
          zIndex: 20,
          opacity: 0.92,
          boxShadow: "0 20px 35px -10px rgba(0,0,0,0.35)",
        },
        nivelOscurecimiento: "opacity-25",
      };
    } else if (offset >= 2) {
      const tx = esPantallaMovil ? 260 : 440;
      return {
        estilo: {
          transform: `translate3d(${tx}px, 0px, -220px) rotateY(-36deg) scale(0.74)`,
          zIndex: 10,
          opacity: 0.55,
          boxShadow: "0 10px 25px -8px rgba(0,0,0,0.2)",
        },
        nivelOscurecimiento: "opacity-45",
      };
    } else {
      const tx = esPantallaMovil ? -260 : -440;
      return {
        estilo: {
          transform: `translate3d(${tx}px, 0px, -220px) rotateY(36deg) scale(0.74)`,
          zIndex: 10,
          opacity: 0.55,
          boxShadow: "0 10px 25px -8px rgba(0,0,0,0.2)",
        },
        nivelOscurecimiento: "opacity-45",
      };
    }
  };

  // Filtrado de locales
  const localesFiltrados = useMemo(() => {
    const rawQuery = busqueda.trim().toLowerCase();
    const filtrarSoloAbiertos = rawQuery.includes("abierto") || rawQuery.includes("abiertos");
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
  }, [locales, busqueda, categoriaActiva, sectorActivo]);

  const scrollADirectorio = () => {
    const el = document.getElementById("directorio-locales");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const localSeleccionadoStepper = locales[indiceStepperLocal] || locales[0];

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5] text-[#18181B] selection:bg-[#EA580C] selection:text-white">
      {/* 1. HEADER EDITORIAL ESTILO CRUST PIZZA CO. */}
      <header className="sticky top-0 z-50 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo Circular Tipo Sello Vintage */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-stone-300 shadow-sm bg-white p-0.5 group-hover:scale-105 transition-transform">
              <img
                src="/logo-pidetirua.jpg"
                alt="PideTirúa"
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

          {/* Menú Superior con Tracking Amplio */}
          <nav className="hidden lg:flex items-center gap-7">
            <a
              href="#directorio-locales"
              className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#EA580C] transition-colors"
            >
              NUESTROS LOCALES
            </a>
            <a
              href="#coverflow-locales"
              className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#EA580C] transition-colors"
            >
              CARTAS 3D
            </a>
            <a
              href="#sectores-comuna"
              className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#EA580C] transition-colors"
            >
              SECTORES
            </a>
            {ofertasDelDia.length > 0 && (
              <a
                href="#ofertas-hoy"
                className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#EA580C] transition-colors flex items-center gap-1"
              >
                <span>OFERTAS DEL DÍA</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
              </a>
            )}
            <a
              href="#historia-comuna"
              className="text-[11px] font-bold tracking-[0.18em] uppercase text-stone-700 hover:text-[#EA580C] transition-colors"
            >
              SABORES LOCALES
            </a>
          </nav>

          {/* Botón Acción Superior Pill */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={scrollADirectorio}
              className="inline-flex items-center gap-2 rounded-full bg-[#EA580C] hover:bg-[#c2410c] text-white text-[11px] font-black uppercase tracking-widest px-5 py-2.5 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Store className="h-3.5 w-3.5" />
              <span>PEDIR PARA RETIRO</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION DE IMPACTO CON PLATO CENTRAL INTERACTIVO */}
      <section className="relative w-full pt-8 pb-16 sm:pb-20 overflow-hidden bg-[#FAF8F5]">
        {/* Elementos Culinarios Flotantes Decorativos en los bordes */}
        <div className="pointer-events-none absolute -top-6 -left-6 w-32 h-32 opacity-35 select-none hidden sm:block">
          <span className="text-5xl">🌿</span>
        </div>
        <div className="pointer-events-none absolute top-1/4 -right-4 w-28 h-28 opacity-30 select-none hidden sm:block">
          <span className="text-4xl">🌶️</span>
        </div>
        <div className="pointer-events-none absolute bottom-10 left-4 w-24 h-24 opacity-25 select-none hidden sm:block">
          <span className="text-3xl">🫒</span>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
          {/* Selector de Categorías y Antojos estilo Crust Pizza */}
          <div className="mb-6 flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500 mb-2">
              SELECCIONA CATEGORÍA O ANTOJO
            </span>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-stone-200/80 border border-stone-300/60 shadow-inner">
              {(["TODOS", "POLLOS", "SUSHI", "MARISCOS", "BURGERS"] as const).map((cat) => {
                const activo = tamanoHeroActivo === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setTamanoHeroActivo(cat);
                      if (cat === "TODOS") setCategoriaActiva("Todos");
                      else if (cat === "POLLOS") setCategoriaActiva("Comida Rápida");
                      else if (cat === "SUSHI") setCategoriaActiva("Sushi");
                      else if (cat === "MARISCOS") setCategoriaActiva("Pescados y Mariscos");
                      else if (cat === "BURGERS") setCategoriaActiva("Comida Rápida");
                    }}
                    className={`px-3 sm:px-4 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all ${
                      activo
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "text-stone-700 hover:text-black"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Arco Radial y Plato Central de Especialidad */}
          {platoActualHero && (
            <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center mt-2">
              {/* Nombres del arco radial interactivo */}
              <div className="hidden md:flex justify-between items-center w-full max-w-xl px-2 mb-4 text-[11px] font-bold uppercase tracking-widest text-stone-500">
                {platosHero.slice(0, 4).map((plato, idx) => (
                  <button
                    key={plato.id}
                    type="button"
                    onClick={() => setIndicePlatoHero(idx)}
                    className={`transition-all hover:text-[#EA580C] ${
                      idx === indicePlatoHero
                        ? "text-[#EA580C] font-black scale-105 underline decoration-2 underline-offset-4"
                        : ""
                    }`}
                  >
                    {plato.nombre.split(" ").slice(0, 2).join(" ")}
                  </button>
                ))}
              </div>

              {/* El Gran Plato Central Redondo */}
              <div className="relative group">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden shadow-2xl ring-8 ring-white/95 border-4 border-stone-200 bg-stone-100 transition-transform duration-500 group-hover:scale-[1.02]">
                  <img
                    src={platoActualHero.imagen}
                    alt={platoActualHero.nombre}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* Botón flotante central de acción */}
                  <Link
                    href={`/${platoActualHero.localSlug}`}
                    className="absolute inset-x-8 bottom-8 sm:bottom-10 bg-[#18181B]/90 hover:bg-[#EA580C] text-white backdrop-blur-md rounded-full py-2.5 px-6 font-display text-lg uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 hover:scale-105"
                  >
                    <span>PEDIR PARA RETIRO</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Badge Flotante Tiempo de Preparación */}
                <div className="absolute -bottom-3 -right-2 bg-white rounded-full px-3.5 py-1.5 shadow-lg border border-stone-200 flex items-center gap-1.5 text-xs font-bold text-stone-800">
                  <Clock className="h-3.5 w-3.5 text-[#EA580C]" />
                  <span>{platoActualHero.tiempoEstimado}</span>
                </div>
              </div>

              {/* Selector de puntos interactivos debajo del plato */}
              <div className="flex items-center gap-2 mt-6">
                {platosHero.map((plato, idx) => (
                  <button
                    key={plato.id}
                    type="button"
                    aria-label={`Ver ${plato.nombre}`}
                    onClick={() => setIndicePlatoHero(idx)}
                    className={`transition-all rounded-full ${
                      idx === indicePlatoHero
                        ? "w-8 h-2.5 bg-[#EA580C]"
                        : "w-2.5 h-2.5 bg-stone-300 hover:bg-stone-500"
                    }`}
                  />
                ))}
              </div>

              {/* Información Destacada del Plato Activo */}
              <div className="mt-4 max-w-lg">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#EA580C] block">
                  {platoActualHero.localNombre} • {platoActualHero.ubicacion}
                </span>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#18181B] tracking-wide uppercase mt-1">
                  {platoActualHero.nombre}
                </h1>
                <p className="font-body text-xs sm:text-sm text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                  {platoActualHero.descripcion}
                </p>
                <div className="mt-2 text-lg sm:text-xl font-black text-stone-900">
                  {formatCLP(platoActualHero.precio)}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. BARRA DE BÚSQUEDA FLOTANTE ESTILO PÍLDORA */}
      <div className="relative z-30 max-w-2xl mx-auto px-4 -mt-4 sm:-mt-6 mb-12">
        <div className="flex items-center rounded-full bg-white shadow-2xl border border-stone-200/90 p-1.5 transition-all hover:border-orange-300">
          {/* Segmento Izquierdo con Marca en Terracota */}
          <div className="bg-[#EA580C] text-white text-[11px] font-black tracking-widest uppercase px-4 sm:px-5 py-2.5 rounded-full flex items-center gap-1.5 shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-sm">restaurant</span>
            <span>PIDETIRÚA</span>
          </div>

          {/* Segmento Central Oscuro con Input */}
          <div className="flex-1 flex items-center bg-[#18181B] rounded-full px-3.5 py-2 text-white mx-1.5">
            <Search className="h-4 w-4 text-stone-400 mr-2 shrink-0" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") scrollADirectorio();
              }}
              placeholder="¿Qué se te antoja hoy? o busca un local..."
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-stone-400 font-medium focus:outline-none"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="text-stone-400 hover:text-white p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Segmento Derecho Botón Rápido */}
          <button
            type="button"
            onClick={scrollADirectorio}
            className="bg-stone-100 hover:bg-[#EA580C] hover:text-white text-stone-900 text-[11px] font-black tracking-widest uppercase px-4 sm:px-5 py-2.5 rounded-full transition-all shrink-0 inline-flex items-center gap-1"
          >
            <span>VER LOCALES</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 4. SECCIÓN COVERFLOW 3D DE LOCALES (CARTAS DIGITALES 3D) */}
      <section
        id="coverflow-locales"
        className="relative w-full py-12 sm:py-16 overflow-hidden bg-[#FAF8F5] border-b border-stone-200/80"
      >
        <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 mb-6 text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white text-stone-900 border border-stone-200 shadow-xs px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm text-[#EA580C]">
              view_carousel
            </span>
            <span className="text-[#EA580C]">EXPERIENCIA 3D</span>
            <span className="text-stone-400">•</span>
            <span>TIRÚA CENTRO &amp; QUIDICO</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-stone-900 uppercase tracking-wide">
            CARTAS DIGITALES DE NUESTRA COMUNA
          </h2>
          <p className="font-body text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
            Explora las cartas y videos de cada local para pedir con retiro directo por WhatsApp
          </p>
        </div>

        <div
          className="relative w-full max-w-6xl mx-auto px-4 overflow-hidden select-none py-6"
          onMouseEnter={() => setPausaCoverflow(true)}
          onMouseLeave={() => setPausaCoverflow(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0].screenX;
            setPausaCoverflow(true);
          }}
          onTouchEnd={(e) => {
            const diff = touchStartX.current - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 40) {
              if (diff > 0) {
                setIndiceCoverflow((prev) => (prev + 1) % locales.length);
              } else {
                setIndiceCoverflow(
                  (prev) => (prev - 1 + locales.length) % locales.length
                );
              }
            }
            setPausaCoverflow(false);
          }}
        >
          {/* Botón Izquierdo Flotante */}
          <button
            type="button"
            aria-label="Local anterior"
            onClick={() =>
              setIndiceCoverflow(
                (prev) => (prev - 1 + locales.length) % locales.length
              )
            }
            className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 md:w-13 md:h-13 rounded-full bg-white/95 hover:bg-white text-stone-900 shadow-xl border border-stone-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="h-6 w-6 text-stone-900" />
          </button>

          {/* Botón Derecho Flotante */}
          <button
            type="button"
            aria-label="Local siguiente"
            onClick={() =>
              setIndiceCoverflow((prev) => (prev + 1) % locales.length)
            }
            className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 md:w-13 md:h-13 rounded-full bg-white/95 hover:bg-white text-stone-900 shadow-xl border border-stone-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="h-6 w-6 text-stone-900" />
          </button>

          {/* Pista Coverflow 3D mostrando los videos y LOGOS de cada local */}
          <div className="coverflow-stage relative w-full h-[470px] md:h-[510px] flex items-center justify-center">
            {locales.map((local, idx) => {
              const { estilo, nivelOscurecimiento } = obtenerEstiloCoverflow(idx);
              const esCentro = idx === indiceCoverflow;
              return (
                <div
                  key={local.id}
                  onClick={() => {
                    if (!esCentro) {
                      setIndiceCoverflow(idx);
                    }
                  }}
                  style={estilo}
                  className="coverflow-card absolute w-[280px] sm:w-[310px] md:w-[340px] h-[440px] md:h-[480px] rounded-3xl overflow-hidden cursor-pointer shadow-2xl bg-stone-900 border border-white/80"
                >
                  {/* Video de fondo y Logo del Comercio */}
                  <div className="absolute inset-0 bg-[#171614] flex items-center justify-center p-8 pb-36">
                    {(local.videoFondo || local.videoPortada) && (
                      <>
                        <img
                          src={getVideoPoster(
                            local.videoFondo || local.videoPortada,
                            local.fotoPortada
                          )}
                          alt=""
                          aria-hidden="true"
                          decoding="async"
                          className="pointer-events-none absolute inset-0 h-full w-full object-cover blur-md opacity-50"
                        />
                        <video
                          src={local.videoFondo || local.videoPortada}
                          poster={getVideoPoster(
                            local.videoFondo || local.videoPortada,
                            local.fotoPortada
                          )}
                          preload="metadata"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="pointer-events-none absolute inset-x-0 top-10 w-full h-56 object-contain"
                        />
                      </>
                    )}
                    <div
                      className={`relative z-10 ${
                        local.videoFondo || local.videoPortada
                          ? "w-32 h-32 md:w-36 md:h-36 mt-12"
                          : "w-44 h-44 md:w-48 md:h-48"
                      } rounded-full shadow-2xl border-4 border-white overflow-hidden flex items-center justify-center bg-white`}
                    >
                      <img
                        src={local.logo_url || local.logo}
                        alt={`Logo ${local.nombre}`}
                        decoding="async"
                        fetchPriority={esCentro ? "high" : "auto"}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  </div>

                  {/* Gradiente de contraste */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/95" />

                  {/* Capa de atenuación para laterales */}
                  <div
                    className={`pointer-events-none absolute inset-0 bg-slate-950 transition-opacity duration-500 ${nivelOscurecimiento}`}
                  />

                  {/* Pill superior estilo Stories */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                    <div className="flex items-center gap-2 bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/25 text-white shadow-lg min-w-0">
                      <img
                        src={local.logo_url || local.logo}
                        alt={`Logo ${local.nombre}`}
                        decoding="async"
                        className="w-6 h-6 rounded-full object-cover border border-white/60 bg-white shadow-xs flex-shrink-0"
                      />
                      <div className="leading-tight truncate">
                        <span className="block text-xs font-bold tracking-tight text-white truncate">
                          {local.nombre}
                        </span>
                        <span className="block text-[10px] font-medium text-orange-200 truncate">
                          {local.ubicacion}
                        </span>
                      </div>
                    </div>
                    <div className="px-2.5 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center gap-1 text-amber-300 shrink-0">
                      <span
                        className="material-symbols-outlined text-xs text-amber-400"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-xs font-bold text-white">
                        {local.calificacion.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Badge de Estado */}
                  <div className="absolute top-16 left-4 z-10 pointer-events-none">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold shadow-md backdrop-blur-md border ${
                        local.abierto
                          ? "bg-emerald-600/95 text-white border-emerald-400/40"
                          : "bg-rose-600/95 text-white border-rose-400/40"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          local.abierto ? "bg-emerald-300 animate-pulse" : "bg-rose-300"
                        }`}
                      />
                      <span>{local.abierto ? "Abierto" : "Cerrado"}</span>
                      <span>•</span>
                      <span>{local.horario || local.tiempoEstimado}</span>
                    </span>
                  </div>

                  {/* Pie de Card con Información y Botón */}
                  <div className="absolute bottom-0 inset-x-0 p-5 text-white z-10 space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#EA580C] block drop-shadow-xs">
                      {local.rubro}
                    </span>
                    <h3 className="font-display text-2xl font-bold leading-snug text-white drop-shadow-sm">
                      {local.nombre}
                    </h3>
                    <p className="font-body text-xs leading-relaxed text-white/90 line-clamp-2">
                      {local.descripcionCorta}
                    </p>
                    <div className="pt-2">
                      <Link
                        href={`/${local.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white text-stone-900 hover:bg-[#EA580C] hover:text-white font-body text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-full flex items-center justify-center gap-1.5 shadow-lg transition-all"
                      >
                        <span>Ver Carta Digital</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicadores de Navegación Puntos */}
          <div className="relative z-10 flex items-center justify-center gap-2 mt-4">
            {locales.map((loc, idx) => (
              <button
                key={loc.id}
                type="button"
                aria-label={`Enfocar ${loc.nombre}`}
                onClick={() => setIndiceCoverflow(idx)}
                className={`transition-all rounded-full ${
                  idx === indiceCoverflow
                    ? "w-7 h-2.5 bg-[#EA580C] shadow-sm"
                    : "w-2.5 h-2.5 bg-stone-300 hover:bg-stone-500"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. SELECTOR DE SECTORES / LOCALES ("VISIT ANY OF OUR LOCATIONS") */}
      <section id="sectores-comuna" className="py-12 sm:py-16 max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#EA580C]">
            ENCUENTRA TU FAVORITO
          </span>
          <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-[#18181B] mt-1">
            VISITA CUALQUIERA DE NUESTROS LOCALES
          </h2>
          <p className="font-body text-xs sm:text-sm text-stone-600 max-w-lg mx-auto mt-1">
            Restaurantes, comida rápida y picadas con tradición en Tirúa Centro y Quidico
          </p>
        </div>

        {/* Stepper / Timeline Bar */}
        <div className="relative max-w-3xl mx-auto mb-10 px-4">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-stone-200 -translate-y-1/2 z-0" />
          <div className="relative z-10 flex justify-between items-center">
            {locales.map((loc, idx) => {
              const activo = idx === indiceStepperLocal;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setIndiceStepperLocal(idx)}
                  className="flex flex-col items-center group focus:outline-none"
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      activo
                        ? "bg-[#EA580C] border-[#EA580C] scale-125 ring-4 ring-orange-200"
                        : "bg-white border-stone-400 group-hover:border-[#EA580C]"
                    }`}
                  />
                  <span
                    className={`mt-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-colors max-w-[80px] sm:max-w-none truncate ${
                      activo
                        ? "text-[#EA580C] font-black"
                        : "text-stone-500 group-hover:text-stone-900"
                    }`}
                  >
                    {loc.nombre.split(" ").slice(0, 2).join(" ")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tarjeta de Local Seleccionado Dividida en 3 Columnas */}
        {localSeleccionadoStepper && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
            {/* Col 1: Información de Retiro y Consumo en Mesa */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-5 bg-[#FAF8F5] rounded-2xl border border-stone-200/70">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                <img
                  src="/logo-pidetirua.jpg"
                  alt="Pide y Retira PideTirúa"
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-contain shadow-md border-4 border-white bg-white"
                />
              </div>
              <span className="mt-3 font-display text-lg uppercase tracking-wider text-stone-900">
                RETIRO EN LOCAL Y EN MESA
              </span>
              <span className="text-[11px] font-semibold text-stone-500">
                {localSeleccionadoStepper.ubicacion} • Pide con anticipación
              </span>
            </div>

            {/* Col 2: Datos, Dirección y Horario */}
            <div className="md:col-span-4 space-y-3.5">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#EA580C]">
                  {localSeleccionadoStepper.rubro}
                </span>
                <h3 className="font-display text-3xl sm:text-4xl text-[#18181B] tracking-wide mt-0.5">
                  {localSeleccionadoStepper.nombre}
                </h3>
                <p className="font-body text-xs text-stone-600 mt-1 leading-relaxed">
                  {localSeleccionadoStepper.descripcionCorta}
                </p>
              </div>

              <div className="space-y-1.5 border-y border-stone-100 py-2.5 text-xs text-stone-700">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-[#EA580C] mt-0.5">location_on</span>
                  <span>{localSeleccionadoStepper.direccionDetalle || localSeleccionadoStepper.direccion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-stone-500">schedule</span>
                  <span>{localSeleccionadoStepper.horario || localSeleccionadoStepper.horarioEntrega}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${localSeleccionadoStepper.abierto ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="font-bold">{localSeleccionadoStepper.abierto ? 'Abierto hoy' : 'Cerrado temporalmente'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/${localSeleccionadoStepper.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EA580C] hover:bg-[#c2410c] text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 transition shadow-sm"
                >
                  <span>VER CARTA DIGITAL</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={`https://wa.me/${(localSeleccionadoStepper.telefonoWhatsapp || localSeleccionadoStepper.telefono_whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${localSeleccionadoStepper.nombre}, quisiera hacer un pedido con retiro desde PideTirúa`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <span>WHATSAPP</span>
                </a>
              </div>
            </div>

            {/* Col 3: Tarjeta de Mapa Estilizada */}
            <div className="md:col-span-4 h-60 sm:h-64 rounded-2xl overflow-hidden relative border border-stone-200 bg-stone-100 flex flex-col justify-between p-4 shadow-inner">
              <div className="relative z-10 flex justify-between items-start">
                <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-800 shadow-sm">
                  {localSeleccionadoStepper.ubicacion}
                </span>
                <span className="rounded-full bg-stone-900 text-white px-2.5 py-0.5 text-[10px] font-bold">
                  {localSeleccionadoStepper.tiempoEstimado}
                </span>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
                <div className="w-12 h-12 rounded-full bg-[#EA580C] text-white flex items-center justify-center shadow-lg animate-bounce">
                  <span className="material-symbols-outlined text-2xl">pin_drop</span>
                </div>
                <span className="font-display text-xl text-stone-900 tracking-wide mt-2">
                  {localSeleccionadoStepper.nombre}
                </span>
                <span className="text-[11px] text-stone-600 font-medium">
                  Tirúa &amp; Quidico, Región del Biobío
                </span>
              </div>

              <div className="relative z-10 text-center">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Carta Digital QR lista en mesa y mostrador
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 6. BANNER INTERACTIVO RECOMENDADOR IA (🎲 ¿QUÉ COMER HOY?) */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 my-4">
        <button
          type="button"
          onClick={() => setMostrarRecomendador(true)}
          className="group relative w-full overflow-hidden rounded-3xl border border-stone-300 bg-white p-5 sm:p-6 text-left shadow-sm transition-all duration-300 hover:shadow-lg hover:border-orange-300"
        >
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
                  🎲 ¿NO SABES QUÉ PEDIR HOY? DESCÚBRELO EN 2 TOQUES
                </h3>
                <p className="text-xs sm:text-sm font-medium text-stone-600">
                  Elige con quién comes y tu antojo del momento. Te sugerimos los 3 mejores platos al instante.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#18181B] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md group-hover:bg-[#EA580C] transition-colors">
              <span>PROBAR AHORA</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </button>
      </div>

      {/* 7. OFERTAS Y PROMOS DE HOY EN TIRÚA */}
      {ofertasDelDia.length > 0 && (
        <section id="ofertas-hoy" className="py-12 max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider">
                <Flame className="h-3 w-3 fill-red-600 text-red-600" />
                <span>OFERTAS DEL DÍA</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-stone-900 tracking-wide uppercase mt-1">
                PROMOS ESPECIALES DE HOY EN TIRÚA
              </h2>
              <p className="font-body text-xs sm:text-sm text-stone-600">
                Descuentos y platos exclusivos con retiro en local o consumo en mesa
              </p>
            </div>

            {ofertasDelDia.length > 1 && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollPromos("izq")}
                  aria-label="Ver ofertas anteriores"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-sm transition hover:bg-stone-100 active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollPromos("der")}
                  aria-label="Ver siguientes ofertas"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-sm transition hover:bg-stone-100 active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={carruselPromosRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
          >
            {ofertasDelDia.map((oferta, idx) => (
              <div
                key={`${oferta.localSlug}-${oferta.productoId}-${idx}`}
                className="group flex w-[280px] sm:w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                  <img
                    src={oferta.imagen}
                    alt={oferta.productoNombre}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="rounded-full bg-[#EA580C] px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow">
                      {oferta.textoPromo}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-1 flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                      {oferta.localNombre}
                    </span>
                    <h3 className="font-display text-xl text-stone-900 tracking-wide uppercase line-clamp-1 mt-0.5">
                      {oferta.productoNombre}
                    </h3>
                    <p className="font-body text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                      {oferta.productoDescripcion}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      {oferta.precioOferta < oferta.precioOriginal && (
                        <span className="block text-[10px] font-bold text-stone-400 line-through">
                          {formatCLP(oferta.precioOriginal)}
                        </span>
                      )}
                      <span className="text-base font-black text-[#EA580C]">
                        {formatCLP(oferta.precioOferta)}
                      </span>
                    </div>

                    <Link
                      href={`/${oferta.localSlug}`}
                      className="rounded-full bg-[#18181B] hover:bg-[#EA580C] text-white text-[11px] font-black uppercase tracking-wider px-4 py-2 transition shadow-sm"
                    >
                      PEDIR PROMO
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. NUESTRO MENÚ / CATÁLOGO COMPLETO DE LOCALES Y PRODUCTOS */}
      <section
        id="directorio-locales"
        className="py-12 sm:py-16 max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8 scroll-mt-24"
      >
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#EA580C]">
            CARTAS DIGITALES &amp; PEDIDOS CON RETIRO
          </span>
          <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-[#18181B]">
            NUESTRO MENÚ Y LOCALES
          </h2>
          <p className="font-body text-xs sm:text-sm text-stone-600">
            Explora las cartas digitales de Tirúa y Quidico. Pide directo al WhatsApp para retiro en local o consumo en mesa.
          </p>
        </div>

        {/* Pestañas de Categorías Estilo Gourmet */}
        <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
          {CATEGORIAS_DIRECTORIO.map((cat) => {
            const activa = categoriaActiva === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activa
                    ? "bg-[#18181B] text-white shadow-md scale-105"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-stone-400"
                }`}
              >
                {cat}
              </button>
            );
          })}

          {/* Filtro rápido por sector */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-300 ml-2">
            {(["Todos", "Tirúa Centro", "Quidico"] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSectorActivo(sec)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  sectorActivo === sec
                    ? "bg-[#EA580C] text-white shadow-sm"
                    : "bg-stone-200/80 text-stone-700 hover:bg-stone-300"
                }`}
              >
                {sec === "Todos" ? "Toda la Comuna" : sec}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Tarjetas de Locales con Estética Crust Pizza Co. */}
        {localesFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {localesFiltrados.map((local) => (
              <LocalCard
                key={local.id}
                local={local}
                onOpenQr={(loc) => setLocalQrModal(loc)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center max-w-md mx-auto">
            <span className="material-symbols-outlined text-4xl text-stone-400">
              restaurant
            </span>
            <h3 className="mt-3 font-display text-2xl text-stone-900 tracking-wide uppercase">
              NO ENCONTRAMOS LOCALES
            </h3>
            <p className="mt-1 font-body text-xs text-stone-600">
              Prueba buscando otro término o restablece los filtros.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setCategoriaActiva("Todos");
                setSectorActivo("Todos");
              }}
              className="mt-4 rounded-full bg-[#18181B] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5"
            >
              Ver todos los locales
            </button>
          </div>
        )}
      </section>

      {/* 9. BLOQUE DE CONTRASTE OSCURO: SABORES DE NUESTRA TIERRA Y MAR */}
      <section id="historia-comuna" className="relative py-20 bg-[#18181B] text-white overflow-hidden mt-12">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Izquierda: Collage Polaroid / Fotográfico */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[340px]">
              <div className="w-52 sm:w-60 bg-white p-2.5 pb-7 rounded-xl shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-300 border border-stone-200">
                <img
                  src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=85"
                  alt="Caleta Quidico"
                  className="w-full h-40 sm:h-48 object-cover rounded"
                />
                <p className="mt-2 text-center text-stone-800 text-[10px] font-bold tracking-widest uppercase">
                  CALETA QUIDICO
                </p>
              </div>

              <div className="w-52 sm:w-60 bg-white p-2.5 pb-7 rounded-xl shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-300 border border-stone-200 -ml-14 sm:-ml-16 mt-12 z-20">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=85"
                  alt="Gastronomía de Tirúa"
                  className="w-full h-40 sm:h-48 object-cover rounded"
                />
                <p className="mt-2 text-center text-stone-800 text-[10px] font-bold tracking-widest uppercase">
                  SABORES DE NUESTRA TIERRA
                </p>
              </div>

              {/* Sello de PideTirúa tipo sticker */}
              <div className="absolute bottom-1 left-4 z-30 w-20 h-20 rounded-full bg-[#FAF8F5] p-1 shadow-2xl border-2 border-stone-300 transform -rotate-12">
                <img
                  src="/logo-pidetirua.jpg"
                  alt="Sello PideTirúa"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>

            {/* Derecha: Copy Editorial e Historia */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#EA580C]">
                GASTRONOMÍA LOCAL CON IDENTIDAD
              </span>
              <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wide uppercase leading-tight">
                SABORES AUTÉNTICOS DE NUESTRA TIERRA Y MAR
              </h2>
              <p className="font-body text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
                PideTirúa es la vitrina gastronómica comunal que une a los emprendedores de <strong>Tirúa Centro</strong> y la emblemática caleta de <strong>Quidico</strong>. Pescados y mariscos frescos de la costa, pollos asados al spiedo, papas fritas rústicas y sándwiches gigantes preparados por las manos de nuestra gente.
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
                  <span>EXPLORAR LA CARTA</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. BARRA DE 3 COLUMNAS INFORMATIVAS */}
      <section className="bg-[#EAE6DF] border-y border-stone-300/60 py-10">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-stone-300/40">
              <div className="w-11 h-11 rounded-full bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center shrink-0">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl text-stone-900 tracking-wide uppercase">
                  PEDIDO CON RETIRO EN LOCAL
                </h3>
                <p className="font-body text-xs text-stone-600 mt-1 leading-relaxed">
                  Pide con anticipación desde tu celular y retira tu comida caliente y lista sin filas en el local.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-stone-300/40">
              <div className="w-11 h-11 rounded-full bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">phishing</span>
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
                <span className="material-symbols-outlined text-2xl">qr_code_2</span>
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

      {/* 11. FOOTER ARTESANAL */}
      <footer className="bg-[#FAF8F5] py-12 text-center text-stone-600">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-wrap justify-center items-center gap-6 text-[11px] font-bold tracking-widest uppercase text-stone-700">
            <a href="#directorio-locales" className="hover:text-[#EA580C] transition">NUESTROS LOCALES</a>
            <a href="#coverflow-locales" className="hover:text-[#EA580C] transition">CARTAS 3D</a>
            <a href="#sectores-comuna" className="hover:text-[#EA580C] transition">SECTORES</a>
            <a href="#ofertas-hoy" className="hover:text-[#EA580C] transition">OFERTAS DEL DÍA</a>
            <a href="#historia-comuna" className="hover:text-[#EA580C] transition">SABORES LOCALES</a>
            <Link href="/superadmin" className="hover:text-[#EA580C] transition">PANEL ADMIN</Link>
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

      {/* Modal de Código QR por Local para escaneo en mesas */}
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
                  <span className="material-symbols-outlined text-sm">qr_code_2</span>
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
