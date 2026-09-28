"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CategoriaFiltro, Local, SectorComuna } from "@/types/local";
import { CATEGORIAS_DIRECTORIO } from "@/lib/locales";
import { formatCLP } from "@/lib/formatters";
import LocalCard from "@/components/LocalCard";

interface DirectoryClientProps {
  locales: Local[];
}

export default function DirectoryClient({ locales }: DirectoryClientProps) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] =
    useState<CategoriaFiltro>("Todos");
  const [sectorActivo, setSectorActivo] = useState<"Todos" | SectorComuna>(
    "Todos"
  );
  const [localQrModal, setLocalQrModal] = useState<Local | null>(null);

  // Estado del Carrusel de Platos Destacados del Hero (extraído de los locales existentes)
  const platosDestacados = useMemo(() => {
    return locales.map((local) => {
      const todosLosProductos = local.categorias.flatMap((c) => c.productos);
      const plato =
        todosLosProductos.find((p) => p.destacado) || todosLosProductos[0];
      return {
        localSlug: local.slug,
        localNombre: local.nombre,
        ubicacion: local.ubicacion,
        tiempoEstimado: local.tiempoEstimado,
        etiqueta: plato?.etiqueta || local.rubro,
        nombre: plato?.nombre || local.nombre,
        descripcion: plato?.descripcion || local.descripcionCorta,
        precio: plato ? formatCLP(plato.precio) : "",
        imagen: plato?.imagen || local.fotoPortada,
      };
    });
  }, [locales]);

  const [indicePlatoHero, setIndicePlatoHero] = useState(0);
  const [animandoTextoHero, setAnimandoTextoHero] = useState(false);
  const [pausaHero, setPausaHero] = useState(false);

  const cambiarPlatoHero = (nuevoIndice: number) => {
    const total = platosDestacados.length;
    if (total === 0) return;
    const normalizado = ((nuevoIndice % total) + total) % total;
    if (normalizado === indicePlatoHero) return;

    setAnimandoTextoHero(true);
    setTimeout(() => {
      setIndicePlatoHero(normalizado);
      setAnimandoTextoHero(false);
    }, 160);
  };

  useEffect(() => {
    if (pausaHero || platosDestacados.length <= 1) return;
    const timer = setInterval(() => {
      setAnimandoTextoHero(true);
      setTimeout(() => {
        setIndicePlatoHero((prev) => (prev + 1) % platosDestacados.length);
        setAnimandoTextoHero(false);
      }, 160);
    }, 5000);
    return () => clearInterval(timer);
  }, [pausaHero, platosDestacados.length]);

  // Estado del Coverflow 3D (con los locales existentes en data/locales.json)
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

  /**
   * Calcula posición 3D manteniendo la tarjeta central en escala 1:1 nativa (translateZ(0) y scale(1))
   * y sin usar CSS filter:brightness() para evitar que el navegador rasterice el texto e imágenes en baja resolución.
   */
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
            "0 25px 50px -12px rgba(12, 74, 110, 0.5), 0 0 0 2px rgba(255,255,255,0.85)",
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

  const iconoMaterialPorCategoria = (cat: CategoriaFiltro) => {
    switch (cat) {
      case "Sushi":
        return "ramen_dining";
      case "Comida Rápida":
        return "lunch_dining";
      case "Pescados y Mariscos":
        return "phishing";
      case "Cafetería":
        return "coffee";
      default:
        return "restaurant";
    }
  };

  const localesFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return locales.filter((local) => {
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

  const platoActualHero = platosDestacados[indicePlatoHero];

  const scrollADirectorio = () => {
    const el = document.getElementById("directorio-locales");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* HEADER FIJO SUPERIOR */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(12,74,110,0.08)]">
        <div className="h-20 max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md flex-shrink-0">
            <Link href="/" className="flex items-center gap-space-xs">
              <img
                src="/logo-pidetirua.jpg"
                alt="Logo PideTirúa"
                className="h-12 w-12 object-contain rounded-full border border-outline-variant/40 bg-white shadow-sm mr-2"
              />
              <div>
                <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight block leading-none">
                  PideTirúa
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  Sabores de nuestra tierra
                </span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-secondary">
                location_on
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Tirúa Centro · Quidico · Región del Biobío
              </span>
            </div>
          </div>

          {/* Buscador rápido en Header */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs xl:max-w-md mx-space-md">
            <div className="relative w-full flex items-center bg-surface-container-low rounded-lg px-space-sm py-space-xs">
              <span className="material-symbols-outlined text-outline text-lg mr-space-xs">
                search
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar local, empanadas, sushi, pollo asado..."
                className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="text-outline hover:text-on-surface"
                  aria-label="Limpiar búsqueda"
                >
                  <span className="material-symbols-outlined text-base">
                    close
                  </span>
                </button>
              )}
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-space-lg">
            <a
              href="#directorio-locales"
              className="transition-colors bg-primary-container text-on-primary font-bold rounded-lg px-space-sm py-space-xs font-label-md text-label-md"
            >
              Locales en Tirúa y Quidico
            </a>
            <a
              href="#coverflow-locales"
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cartas Digitales 3D
            </a>
          </nav>

          <div className="flex items-center gap-space-sm flex-shrink-0">
            <span className="hidden md:inline-flex items-center gap-1 bg-surface-container text-on-surface px-space-sm py-space-xs rounded-lg font-label-md text-label-md font-semibold">
              <span className="material-symbols-outlined text-base text-secondary">
                map
              </span>
              Provincia de Arauco, Chile
            </span>
          </div>
        </div>
      </header>

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-20rem)]">
        <div className="flex flex-col w-full">
          {/* HERO CON ESPÍRITU LAFKENCHE Y COSTA DEL PACÍFICO */}
          <section className="relative w-full bg-primary overflow-hidden text-on-primary">
            {/* Patrón geométrico sutil estilo textil Lafkenche de fondo */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg
                className="w-full h-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 800 400"
              >
                <path
                  d="M0,50 L400,250 L800,50 L800,200 L400,400 L0,200 Z"
                  fill="currentColor"
                />
                <path
                  d="M50,0 L100,50 L50,100 L0,50 Z"
                  fill="currentColor"
                />
                <path
                  d="M750,0 L800,50 L750,100 L700,50 Z"
                  fill="currentColor"
                />
                <path
                  d="M400,0 L450,50 L400,100 L350,50 Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {/* Gradiente oceánico profundo con bruma costera */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-container/80 to-transparent" />

            <div className="relative max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-center">
              <div className="lg:col-span-7 space-y-space-md z-10">
                {/* Badge de Identidad Comunal */}
                <div className="inline-flex items-center gap-space-xs bg-surface-container-lowest/15 backdrop-blur-md px-space-md py-space-xs rounded-full">
                  <span className="material-symbols-outlined text-secondary-fixed text-sm">
                    explore
                  </span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-secondary-fixed">
                    Directorio Gastronómico &amp; Menú Digital QR
                  </span>
                </div>

                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-primary font-extrabold tracking-tight leading-none">
                  PideTirúa <span className="text-secondary-fixed">-</span>{" "}
                  Sabores de nuestra tierra
                </h1>

                <p className="font-body-lg text-body-lg text-primary-fixed-dim max-w-xl">
                  Descubre la gastronomía costera de <strong>Tirúa</strong> y{" "}
                  <strong>Quidico</strong>. Revisa la carta actualizada de cada
                  local, arma tu pedido desde tu celular y envíalo directo al{" "}
                  <strong className="text-secondary-fixed">
                    WhatsApp (+569)
                  </strong>{" "}
                  sin comisiones ni intermediarios.
                </p>

                {/* Barra de Búsqueda Interactiva y Selector de Sector */}
                <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-xl flex flex-col md:flex-row gap-space-sm max-w-2xl text-on-surface">
                  {/* Selector Comunal */}
                  <div className="relative md:w-1/3 flex items-center bg-surface-container-low rounded-lg px-space-sm py-space-xs">
                    <span className="material-symbols-outlined text-secondary text-xl mr-1">
                      pin_drop
                    </span>
                    <select
                      aria-label="Seleccionar sector de la comuna"
                      value={sectorActivo}
                      onChange={(e) =>
                        setSectorActivo(
                          e.target.value as "Todos" | SectorComuna
                        )
                      }
                      className="bg-transparent font-label-md text-label-md text-on-surface font-semibold w-full focus:outline-none cursor-pointer"
                    >
                      <option value="Todos">Toda la Comuna</option>
                      <option value="Tirúa Centro">Tirúa Centro</option>
                      <option value="Quidico">Quidico</option>
                    </select>
                  </div>

                  {/* Input Buscador */}
                  <div className="relative flex-1 flex items-center bg-surface-container-low rounded-lg px-space-sm py-space-xs">
                    <span className="material-symbols-outlined text-outline text-xl mr-2">
                      search
                    </span>
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar local, empanadas, sushi, pollo asado, Quidico..."
                      className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
                    />
                    {busqueda && (
                      <button
                        type="button"
                        onClick={() => setBusqueda("")}
                        className="text-outline hover:text-on-surface"
                        aria-label="Limpiar búsqueda"
                      >
                        <span className="material-symbols-outlined text-base">
                          close
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Botón de Búsqueda */}
                  <button
                    type="button"
                    onClick={scrollADirectorio}
                    className="bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg px-space-lg py-space-sm rounded-lg flex items-center justify-center gap-space-xs transition-colors"
                  >
                    <span>Buscar</span>
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </button>
                </div>

                {/* Indicadores de beneficios */}
                <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                  <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-surface-variant">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    Carta QR exclusiva por local
                  </div>
                  <span className="text-surface-variant/40 font-label-sm">
                    •
                  </span>
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-surface-variant">
                    <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">
                      chat
                    </span>
                    Pedido directo a WhatsApp (+569)
                  </div>
                  <span className="text-surface-variant/40 font-label-sm">
                    •
                  </span>
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-surface-variant">
                    <span className="material-symbols-outlined text-sm text-secondary-fixed">
                      verified
                    </span>
                    Delivery, Retiro o Consumo en mesa
                  </div>
                </div>
              </div>

              {/* Imagen Destacada Editorial del Hero: Carrusel Interactivo con los Platos de nuestros Locales */}
              {platoActualHero && (
                <div className="lg:col-span-5 relative mt-space-lg lg:mt-0">
                  <div className="relative mx-auto max-w-md lg:max-w-none">
                    <div className="absolute -top-4 -left-4 w-28 h-28 bg-secondary-container/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-6 -right-6 w-36 h-36 bg-tertiary-container/30 rounded-full blur-2xl" />

                    <div
                      className="relative bg-surface-container-lowest p-2 rounded-2xl shadow-2xl overflow-hidden transform lg:rotate-1 hover:rotate-0 transition-transform duration-300 hero-image-card"
                      onMouseEnter={() => setPausaHero(true)}
                      onMouseLeave={() => setPausaHero(false)}
                    >
                      <div className="relative w-full h-80 rounded-xl overflow-hidden bg-surface-container">
                        {platosDestacados.map((plato, idx) => (
                          <img
                            key={plato.localSlug}
                            src={plato.imagen}
                            alt={plato.nombre}
                            decoding="async"
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                              idx === indicePlatoHero
                                ? "opacity-100"
                                : "opacity-0 pointer-events-none"
                            }`}
                          />
                        ))}

                        {/* Flechas Izquierda / Derecha */}
                        <button
                          type="button"
                          aria-label="Plato anterior"
                          onClick={() =>
                            cambiarPlatoHero(indicePlatoHero - 1)
                          }
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md z-20"
                        >
                          <span className="material-symbols-outlined text-lg">
                            chevron_left
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label="Plato siguiente"
                          onClick={() =>
                            cambiarPlatoHero(indicePlatoHero + 1)
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md z-20"
                        >
                          <span className="material-symbols-outlined text-lg">
                            chevron_right
                          </span>
                        </button>

                        {/* Indicadores (Dots) */}
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full z-20">
                          {platosDestacados.map((plato, idx) => (
                            <button
                              key={plato.localSlug}
                              type="button"
                              aria-label={`Ver plato de ${plato.localNombre}`}
                              onClick={() => cambiarPlatoHero(idx)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === indicePlatoHero
                                  ? "bg-white scale-125"
                                  : "bg-white/50 hover:bg-white/80"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Información Dinámica del Plato */}
                      <Link
                        href={`/${platoActualHero.localSlug}`}
                        className="p-space-sm bg-surface-container-lowest flex items-center justify-between min-h-[5.25rem]"
                      >
                        <div
                          className={`transition-all duration-300 ${
                            animandoTextoHero
                              ? "opacity-0 translate-y-1"
                              : "opacity-100 translate-y-0"
                          }`}
                        >
                          <p className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                            {platoActualHero.localNombre} •{" "}
                            {platoActualHero.ubicacion}
                          </p>
                          <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                            {platoActualHero.nombre}
                          </h2>
                          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                            {platoActualHero.descripcion}
                          </p>
                        </div>
                        <div
                          className={`text-right flex-shrink-0 ml-2 transition-all duration-300 ${
                            animandoTextoHero
                              ? "opacity-0 translate-y-1"
                              : "opacity-100 translate-y-0"
                          }`}
                        >
                          <span className="font-label-lg text-label-lg font-bold text-tertiary">
                            {platoActualHero.precio}
                          </span>
                          <span className="block font-label-sm text-label-sm text-outline">
                            {platoActualHero.etiqueta}
                          </span>
                        </div>
                      </Link>
                    </div>

                    {/* Micro Badge Flotante Reparto Dinámico */}
                    <div className="absolute -bottom-4 -left-4 bg-surface-container-lowest text-on-surface p-space-sm rounded-xl shadow-lg flex items-center gap-space-sm z-30">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-xl">
                          schedule
                        </span>
                      </div>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                          Entrega estimada
                        </p>
                        <p className="font-headline-sm text-headline-sm text-primary font-extrabold leading-none">
                          {platoActualHero.tiempoEstimado}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECCIÓN COVERFLOW 3D PERSPECTIVE CON LOS LOGOS DE LOS NEGOCIOS */}
          <section
            id="coverflow-locales"
            className="relative w-full bg-gradient-to-b from-surface-container-low via-surface to-surface-container-lowest py-space-xl overflow-hidden border-b border-outline-variant/30"
          >
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop mb-6 text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-secondary-container/20 text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">
                  view_carousel
                </span>
                <span>Experiencia 3D • Tirúa Centro &amp; Quidico</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-primary font-extrabold tracking-tight">
                Cartas Digitales de Nuestra Comuna
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
                Selecciona un local para abrir su carta digital y pedir directo
                por WhatsApp
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
                const diff =
                  touchStartX.current - e.changedTouches[0].screenX;
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
                className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 md:w-13 md:h-13 rounded-full bg-surface-container-lowest/95 hover:bg-white text-primary shadow-xl border border-outline-variant/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <span className="material-symbols-outlined text-2xl font-bold">
                  chevron_left
                </span>
              </button>

              {/* Botón Derecho Flotante */}
              <button
                type="button"
                aria-label="Local siguiente"
                onClick={() =>
                  setIndiceCoverflow((prev) => (prev + 1) % locales.length)
                }
                className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 md:w-13 md:h-13 rounded-full bg-surface-container-lowest/95 hover:bg-white text-primary shadow-xl border border-outline-variant/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <span className="material-symbols-outlined text-2xl font-bold">
                  chevron_right
                </span>
              </button>

              {/* Pista Coverflow 3D mostrando los LOGOS de cada negocio */}
              <div className="coverflow-stage relative w-full h-[480px] md:h-[520px] flex items-center justify-center">
                {locales.map((local, idx) => {
                  const { estilo, nivelOscurecimiento } =
                    obtenerEstiloCoverflow(idx);
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
                      className="coverflow-card absolute w-[280px] sm:w-[310px] md:w-[340px] h-[450px] md:h-[490px] rounded-3xl overflow-hidden cursor-pointer shadow-2xl bg-surface-container-lowest border border-white/70"
                    >
                      {/* Contenedor central con el LOGO del negocio sin recortar bordes */}
                      <div className="absolute inset-0 bg-surface-container-low flex items-center justify-center p-8 pb-36">
                        <div
                          className="w-44 h-44 md:w-52 md:h-52 rounded-full shadow-xl border-4 border-white overflow-hidden flex items-center justify-center"
                          style={{
                            backgroundColor:
                              local.slug === "las-tranqueras"
                                ? "#f8dc4b"
                                : local.slug === "rio-mar"
                                ? "#000000"
                                : local.slug === "gran-pacifico"
                                ? "#194a6e"
                                : "#ffffff",
                          }}
                        >
                          <img
                            src={local.logo}
                            alt={`Logo ${local.nombre}`}
                            decoding="async"
                            fetchPriority={esCentro ? "high" : "auto"}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      {/* Gradiente editorial de contraste nítido */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/90" />

                      {/* Capa de atenuación para tarjetas laterales */}
                      <div
                        className={`pointer-events-none absolute inset-0 bg-slate-950 transition-opacity duration-500 ${nivelOscurecimiento}`}
                      />

                      {/* Pill superior estilo Stories con miniatura del logo */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                        <div className="flex items-center gap-2.5 bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/25 text-white shadow-lg min-w-0">
                          <img
                            src={local.logo}
                            alt={`Logo ${local.nombre}`}
                            decoding="async"
                            className="w-7 h-7 rounded-full object-cover border border-white/60 bg-white shadow-sm flex-shrink-0"
                          />
                          <div className="leading-tight truncate">
                            <span className="block text-xs font-bold tracking-tight text-white truncate">
                              {local.nombre}
                            </span>
                            <span className="block text-[10px] font-medium text-secondary-fixed truncate">
                              {local.ubicacion}
                            </span>
                          </div>
                        </div>
                        <div className="px-2.5 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center gap-1 text-amber-300 shrink-0">
                          <span
                            className="material-symbols-outlined text-sm text-amber-400"
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
                        <span className="inline-flex items-center gap-1.5 bg-green-600 text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          {local.abierto ? "Abierto ahora" : "Cerrado"} ·{" "}
                          {local.tiempoEstimado}
                        </span>
                      </div>

                      {/* Pie de Card con Información y Botón a Carta Digital */}
                      <div className="absolute bottom-0 inset-x-0 p-5 text-white z-10 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-secondary-fixed block drop-shadow-xs">
                          {local.rubro}
                        </span>
                        <h3 className="font-headline-sm text-xl md:text-[22px] font-bold leading-snug text-white drop-shadow-sm">
                          {local.nombre}
                        </h3>
                        <p className="text-[13px] leading-relaxed text-white/95 line-clamp-2">
                          {local.descripcionCorta}
                        </p>
                        <div className="pt-2.5">
                          <Link
                            href={`/${local.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-surface-container-lowest text-primary hover:bg-secondary-fixed font-label-md text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-colors"
                          >
                            <span>Ver Carta</span>
                            <span className="material-symbols-outlined text-sm">
                              arrow_forward
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Indicadores de Navegación Puntos */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {locales.map((loc, idx) => (
                  <button
                    key={loc.id}
                    type="button"
                    aria-label={`Enfocar ${loc.nombre}`}
                    onClick={() => setIndiceCoverflow(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === indiceCoverflow
                        ? "bg-primary scale-125"
                        : "bg-outline-variant hover:bg-primary"
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* CHIPS DE FILTRO RÁPIDO STICKY */}
          <section className="w-full bg-surface-container-lowest shadow-sm sticky top-20 z-40">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-sm overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-space-xs min-w-max">
                <span className="font-label-md text-label-md text-outline mr-2 hidden sm:inline">
                  Explorar por:
                </span>

                {CATEGORIAS_DIRECTORIO.map((categoria) => {
                  const activa = categoriaActiva === categoria;
                  return (
                    <button
                      key={categoria}
                      type="button"
                      onClick={() => setCategoriaActiva(categoria)}
                      className={`filter-chip flex items-center gap-1.5 px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ${
                        activa
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-base ${
                          activa ? "text-on-primary" : "text-secondary"
                        }`}
                      >
                        {iconoMaterialPorCategoria(categoria)}
                      </span>
                      <span>{categoria}</span>
                    </button>
                  );
                })}

                {/* Selector rápido de sector en barra sticky */}
                <div className="flex items-center gap-1 ml-2 border-l border-outline-variant/40 pl-2">
                  {(["Todos", "Tirúa Centro", "Quidico"] as const).map(
                    (sector) => {
                      const activo = sectorActivo === sector;
                      return (
                        <button
                          key={sector}
                          type="button"
                          onClick={() => setSectorActivo(sector)}
                          className={`filter-chip flex items-center gap-1 px-space-sm py-space-xs rounded-full font-label-sm text-label-sm transition-all ${
                            activo
                              ? "bg-secondary text-on-secondary shadow-sm"
                              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            location_on
                          </span>
                          <span>
                            {sector === "Todos" ? "Toda la Comuna" : sector}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <span className="flex items-center gap-1.5 bg-green-100 text-green-800 px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all ml-auto">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  <span>
                    {localesFiltrados.length}{" "}
                    {localesFiltrados.length === 1
                      ? "local disponible"
                      : "locales disponibles"}
                  </span>
                </span>
              </div>
            </div>
          </section>

          {/* CONTENIDO PRINCIPAL: DIRECTORIO DE LOCALES */}
          <section
            id="directorio-locales"
            className="max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl w-full space-y-space-xl scroll-mt-32"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm pb-space-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-2xl">
                    verified
                  </span>
                  <span className="font-label-md text-label-md text-tertiary font-bold tracking-wider uppercase">
                    Directorio Gastronómico &amp; Menú Digital QR
                  </span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-primary font-bold">
                  Locales en Tirúa y Quidico
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Selecciona un local para abrir su carta digital y pedir
                  directo por WhatsApp
                </p>
              </div>

              <div className="flex items-center gap-space-sm">
                <span className="rounded-full bg-surface-container px-space-md py-space-xs font-label-md text-label-md text-primary font-bold">
                  {localesFiltrados.length}{" "}
                  {localesFiltrados.length === 1
                    ? "local disponible"
                    : "locales disponibles"}
                </span>
              </div>
            </div>

            {/* Cuadrícula de tarjetas de locales */}
            {localesFiltrados.length > 0 ? (
              <div
                id="localesGridDirectory"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter-desktop"
              >
                {localesFiltrados.map((local) => (
                  <LocalCard
                    key={local.id}
                    local={local}
                    onOpenQr={(loc) => setLocalQrModal(loc)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-outline">
                  restaurant
                </span>
                <h3 className="mt-3 font-headline-sm text-headline-sm font-bold text-primary">
                  No encontramos locales con esos filtros
                </h3>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  Prueba buscando otro plato o restablece las categorías de
                  búsqueda.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");
                    setCategoriaActiva("Todos");
                    setSectorActivo("Todos");
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-space-lg py-space-sm font-label-md text-label-md font-bold text-on-primary hover:bg-primary-container"
                >
                  Ver todos los locales
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* FOOTER COMUNAL */}
      <footer className="w-full bg-surface-container-low mt-space-xl border-t border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-space-md text-center md:text-left">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-pidetirua.jpg"
                alt="Logo PideTirúa"
                className="h-11 w-11 rounded-full object-contain border border-outline-variant/40 bg-white shadow-sm"
              />
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                PideTirúa — Sabores de nuestra tierra
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Plataforma gastronómica para emprendedores y locales de Tirúa y
              Quidico, Región del Biobío, Chile.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de Código QR por Local para escaneo en mesas / mostrador */}
      {localQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setLocalQrModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-secondary">
                  <span className="material-symbols-outlined text-sm">
                    qr_code_2
                  </span>
                  Menú QR Exclusivo
                </span>
                <h3 className="mt-1 font-headline-sm text-headline-sm font-bold text-primary">
                  {localQrModal.nombre}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {localQrModal.ubicacion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocalQrModal(null)}
                className="rounded-full p-1.5 text-outline hover:bg-surface-container-low hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="my-5 flex flex-col items-center rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `https://pidetirua.cl/${localQrModal.slug}`
                )}`}
                alt={`QR ${localQrModal.nombre}`}
                className="h-44 w-44 rounded-lg bg-white p-2 shadow-sm"
              />
              <code className="mt-3 rounded bg-surface-container px-2.5 py-1 text-xs font-semibold text-primary">
                /{localQrModal.slug}
              </code>
              <p className="mt-2 text-center font-body-sm text-body-sm text-on-surface-variant">
                Escanea este QR en mesa o mostrador para abrir directamente el
                menú móvil de <strong>{localQrModal.nombre}</strong>.
              </p>
            </div>

            <Link
              href={`/${localQrModal.slug}`}
              onClick={() => setLocalQrModal(null)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-label-lg text-label-lg font-bold text-on-primary hover:bg-primary-container"
            >
              <span>Ir al Menú Móvil</span>
              <span className="material-symbols-outlined text-base">
                open_in_new
              </span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
