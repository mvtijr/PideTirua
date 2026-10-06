"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CategoriaFiltro, Local, SectorComuna } from "@/types/local";
import { CATEGORIAS_DIRECTORIO } from "@/lib/locales";
import { formatCLP } from "@/lib/formatters";
import { getVideoPoster } from "@/lib/localTheme";
import { GradientWave } from "@/components/ui/gradient-wave";
import LocalCard from "@/components/LocalCard";
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Dices, Sparkles } from "lucide-react";
import RecomendadorPlatosModal from "@/components/RecomendadorPlatosModal";
import VoiceSearchInput from "@/components/VoiceSearchInput";

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
  const [mostrarRecomendador, setMostrarRecomendador] = useState(false);

  // Platos con Oferta activa del Día de locales abiertos y activos
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
                localLogo: loc.logo,
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

  // Filtrado inteligente: soporta búsqueda por voz con detección de "abierto/abiertos"
  const localesFiltrados = useMemo(() => {
    const rawQuery = busqueda.trim().toLowerCase();

    // Detección de intención por voz: "abierto", "abiertos", "abierto ahora"
    const filtrarSoloAbiertos =
      rawQuery.includes("abierto") || rawQuery.includes("abiertos");

    // Limpieza de términos de estado para emparejar platos o rubros (ej: "sushi abierto" -> "sushi")
    const query = rawQuery
      .replace(/\babiertos\b/g, "")
      .replace(/\babierto\b/g, "")
      .replace(/\bahora\b/g, "")
      .trim();

    return locales.filter((local) => {
      // Si el cliente pide explícitamente locales abiertos, excluir los cerrados
      if (filtrarSoloAbiertos && !local.abierto) {
        return false;
      }

      const coincideCategoria =
        categoriaActiva === "Todos" ||
        local.categoriaFiltro.includes(categoriaActiva);

      const coincideSector =
        sectorActivo === "Todos" || local.sector === sectorActivo;

      if (!coincideCategoria || !coincideSector) return false;

      // Si solo dijo "abierto" sin otro término, ya pasó la condición
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
    <div className="relative min-h-screen w-full">
      {/* Fondo animado WebGL GradientWave en toda la página principal */}
      <GradientWave className="fixed inset-0 pointer-events-none z-0" />

      {/* HEADER FIJO SUPERIOR */}
      <header className="fixed top-0 w-full z-50 bg-white/65 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_16px_-2px_rgba(12,74,110,0.08)]">
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

            <div className="hidden sm:flex items-center gap-space-xs bg-white/80 backdrop-blur-md border border-white/60 px-space-sm py-space-xs rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-secondary">
                location_on
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Tirúa Centro · Quidico · Región del Biobío
              </span>
            </div>
          </div>

          {/* Buscador rápido en Header con soporte de voz */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs xl:max-w-md mx-space-md">
            <VoiceSearchInput
              value={busqueda}
              onChange={setBusqueda}
              onClear={() => setBusqueda("")}
              placeholder="Buscar local, sushi, empanadas..."
            />
          </div>

          <nav className="hidden xl:flex items-center gap-space-lg">
            <a
              href="#directorio-locales"
              className="transition-colors bg-primary text-on-primary font-bold rounded-lg px-space-sm py-space-xs font-label-md text-label-md shadow-sm"
            >
              Locales en Tirúa y Quidico
            </a>
            <a
              href="#coverflow-locales"
              className="font-label-lg text-label-lg text-primary font-bold hover:text-secondary transition-colors"
            >
              Cartas Digitales 3D
            </a>
          </nav>

          <div className="flex items-center gap-space-sm flex-shrink-0">
            <span className="hidden md:inline-flex items-center gap-1 bg-white/80 backdrop-blur-md border border-white/60 text-primary px-space-sm py-space-xs rounded-lg font-label-md text-label-md font-semibold">
              <span className="material-symbols-outlined text-base text-secondary">
                map
              </span>
              Provincia de Arauco, Chile
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full pt-20 min-h-[calc(100vh-20rem)]">
        <div className="flex flex-col w-full">
          {/* HERO SOBRE EL FONDO ANIMADO GRADIENT WAVE */}
          <section className="relative w-full overflow-hidden text-primary">
            <div className="relative max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-center">
              <div className="lg:col-span-7 space-y-space-md z-10">
                {/* Badge de Identidad Comunal */}
                <div className="inline-flex items-center gap-space-xs bg-white/80 backdrop-blur-md border border-white/80 shadow-sm px-space-md py-space-xs rounded-full">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    explore
                  </span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-bold">
                    Directorio Gastronómico &amp; Menú Digital QR
                  </span>
                </div>

                <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-primary font-extrabold tracking-tight leading-none drop-shadow-xs">
                  PideTirúa <span className="text-secondary">-</span>{" "}
                  Sabores de nuestra tierra
                </h1>

                <p className="font-body-lg text-body-lg text-slate-800 font-medium max-w-xl bg-white/55 backdrop-blur-xs rounded-xl p-3 border border-white/60">
                  Descubre la gastronomía costera de <strong>Tirúa</strong> y{" "}
                  <strong>Quidico</strong>. Revisa la carta actualizada de cada
                  local, arma tu pedido desde tu celular y envíalo directo al{" "}
                  <strong className="text-secondary">
                    WhatsApp (+569)
                  </strong>{" "}
                  sin comisiones ni intermediarios.
                </p>

                {/* Barra de Búsqueda Interactiva y Selector de Sector */}
                <div className="bg-white/90 backdrop-blur-md border border-white p-space-sm rounded-xl shadow-xl flex flex-col md:flex-row gap-space-sm max-w-2xl text-on-surface">
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

                  {/* Input Buscador con Reconocimiento de Voz */}
                  <div className="flex-1">
                    <VoiceSearchInput
                      value={busqueda}
                      onChange={setBusqueda}
                      onClear={() => setBusqueda("")}
                      placeholder="Buscar local, sushi, empanadas, abierto ahora..."
                    />
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
                  <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-primary font-bold bg-white/75 backdrop-blur-xs px-3 py-1 rounded-full border border-white/70">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    Carta QR exclusiva por local
                  </div>
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold bg-white/75 backdrop-blur-xs px-3 py-1 rounded-full border border-white/70">
                    <span className="material-symbols-outlined text-sm text-tertiary">
                      chat
                    </span>
                    Pedido directo a WhatsApp (+569)
                  </div>
                  <div className="flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold bg-white/75 backdrop-blur-xs px-3 py-1 rounded-full border border-white/70">
                    <span className="material-symbols-outlined text-sm text-secondary">
                      verified
                    </span>
                    Retiro en local o Consumo en mesa
                  </div>
                </div>
              </div>

              {/* Imagen Destacada Editorial del Hero: Carrusel Interactivo con los Platos de nuestros Locales */}
              {platoActualHero && (
                <div className="lg:col-span-5 relative mt-space-lg lg:mt-0">
                  <div className="relative mx-auto max-w-md lg:max-w-none">
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

                    {/* Micro Badge Flotante Tiempo de Preparación */}
                    <div className="absolute -bottom-4 -left-4 bg-surface-container-lowest text-on-surface p-space-sm rounded-xl shadow-lg flex items-center gap-space-sm z-30">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-xl">
                          schedule
                        </span>
                      </div>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                          Tiempo preparación
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

          {/* BANNER INTERACTIVO RECOMENDADOR IA: ¿NO SABES QUÉ PEDIR HOY? */}
          <div className="max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop my-4 sm:my-6">
            <button
              type="button"
              onClick={() => setMostrarRecomendador(true)}
              className="group relative w-full overflow-hidden rounded-3xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 sm:p-6 text-left text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="absolute -right-8 -bottom-8 h-36 w-36 rounded-full bg-white/15 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-amber-100 group-hover:rotate-12 transition-transform duration-300">
                    <Dices className="h-8 w-8" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                      Recomendador Rápido
                    </span>
                    <h3 className="mt-1 text-lg sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                      🎲 ¿No sabes qué pedir hoy? Descúbrelo en 2 toques
                    </h3>
                    <p className="mt-0.5 text-xs sm:text-sm font-semibold text-white/90">
                      Elige con quién comes y tu antojo del momento. Te recomendamos los 3 mejores platos al instante.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-black text-slate-900 shadow-md transition-all group-hover:bg-amber-100 group-hover:translate-x-1">
                  <span>Probar ahora</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          </div>

          {/* SECCIÓN COMUNAL: 🔥 OFERTAS Y PROMOS DE HOY EN TIRÚA */}
          {ofertasDelDia.length > 0 && (
            <section
              id="ofertas-hoy"
              className="relative w-full py-8 md:py-10 bg-gradient-to-b from-orange-50/70 via-amber-50/40 to-transparent border-y border-orange-200/50"
            >
              <div className="max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
                {/* Encabezado con título, badge y controles de navegación */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-3 py-1 text-xs font-black text-white shadow-sm">
                      <Flame className="h-3.5 w-3.5 fill-amber-300 text-amber-300 animate-pulse" />
                      <span>Promos Especiales de Hoy</span>
                    </div>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      🔥 Ofertas y Promos de Hoy en Tirúa
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
                      Descuentos imperdibles en locales de Tirúa Centro y Quidico. ¡Pide antes que se agoten!
                    </p>
                  </div>

                  {/* Botones de navegación para desktop / tablet */}
                  {ofertasDelDia.length > 1 && (
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => scrollPromos("izq")}
                        aria-label="Ver ofertas anteriores"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-white text-slate-700 shadow-sm transition hover:bg-orange-50 hover:text-orange-600 active:scale-95"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollPromos("der")}
                        aria-label="Ver siguientes ofertas"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-white text-slate-700 shadow-sm transition hover:bg-orange-50 hover:text-orange-600 active:scale-95"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Pista desplazable / swipeable en móvil con snap */}
                <div
                  ref={carruselPromosRef}
                  className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
                >
                  {ofertasDelDia.map((oferta, idx) => {
                    const tieneDescuento =
                      oferta.precioOferta < oferta.precioOriginal;
                    const porcentajeDescuento = tieneDescuento
                      ? Math.round(
                          ((oferta.precioOriginal - oferta.precioOferta) /
                            oferta.precioOriginal) *
                            100
                        )
                      : null;

                    return (
                      <div
                        key={`${oferta.localSlug}-${oferta.productoId}-${idx}`}
                        className="group flex w-[285px] sm:w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        {/* Foto del plato con badges flotantes */}
                        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                          <img
                            src={oferta.imagen}
                            alt={oferta.productoNombre}
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                          {/* Etiqueta de Promo llamativa */}
                          <div className="absolute left-3 top-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-2.5 py-1 text-[11px] font-black text-white shadow-lg">
                              <Flame className="h-3 w-3 fill-amber-300 text-amber-300" />
                              <span>{oferta.textoPromo}</span>
                            </span>
                          </div>

                          {/* Porcentaje OFF si aplica */}
                          {porcentajeDescuento && (
                            <div className="absolute right-3 top-3">
                              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-black text-slate-950 shadow-md">
                                -{porcentajeDescuento}%
                              </span>
                            </div>
                          )}

                          {/* Estado del local (Abierto / Cerrado) */}
                          <div className="absolute bottom-2.5 left-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold backdrop-blur-md shadow-xs ${
                                oferta.localAbierto
                                  ? "bg-emerald-600/90 text-white"
                                  : "bg-rose-600/90 text-white"
                              }`}
                            >
                              <span>
                                {oferta.localAbierto ? "🟢 Abierto" : "🔴 Cerrado"}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Contenido de la tarjeta */}
                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            {/* Nombre del local de origen */}
                            <Link
                              href={`/${oferta.localSlug}`}
                              className="group/local inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
                            >
                              {oferta.localLogo && (
                                <img
                                  src={oferta.localLogo}
                                  alt={oferta.localNombre}
                                  className="h-4 w-4 rounded-full object-cover border border-slate-200"
                                />
                              )}
                              <span className="line-clamp-1 group-hover/local:underline">
                                {oferta.localNombre}
                              </span>
                            </Link>

                            {/* Nombre del plato */}
                            <h3 className="mt-1 text-base font-black text-slate-900 line-clamp-1">
                              {oferta.productoNombre}
                            </h3>

                            {/* Descripción del plato */}
                            {oferta.productoDescripcion && (
                              <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                                {oferta.productoDescripcion}
                              </p>
                            )}
                          </div>

                          {/* Precios y Botón "Pedir Promo" */}
                          <div className="mt-4 border-t border-slate-100 pt-3">
                            <div className="mb-3 flex items-baseline justify-between">
                              <div>
                                {tieneDescuento && (
                                  <span className="block text-[11px] font-bold text-slate-400 line-through">
                                    {formatCLP(oferta.precioOriginal)}
                                  </span>
                                )}
                                <span className="text-lg font-black text-emerald-600 sm:text-xl">
                                  {formatCLP(oferta.precioOferta)}
                                </span>
                              </div>

                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {oferta.localHorario}
                              </span>
                            </div>

                            <Link
                              href={`/${oferta.localSlug}`}
                              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 px-4 text-sm font-extrabold text-white shadow-md transition-all hover:from-emerald-500 hover:to-emerald-400 active:scale-95"
                            >
                              <span>Pedir Promo</span>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* SECCIÓN COVERFLOW 3D PERSPECTIVE SOBRE EL FONDO GRADIENT WAVE */}
          <section
            id="coverflow-locales"
            className="relative w-full py-space-xl overflow-hidden"
          >
            <div className="relative z-10 max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop mb-6 text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md text-primary border border-white shadow-sm px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm text-secondary">
                  view_carousel
                </span>
                <span>Experiencia 3D • Tirúa Centro &amp; Quidico</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-primary font-extrabold tracking-tight drop-shadow-xs">
                Cartas Digitales de Nuestra Comuna
              </h2>
              <p className="font-body-md text-body-md text-slate-800 font-semibold max-w-2xl mx-auto">
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
                      {/* Contenedor central con video de fondo optimizado (1 solo decodificador por tarjeta + poster instantáneo) y el LOGO del negocio */}
                      <div className="absolute inset-0 bg-[#171614] flex items-center justify-center p-8 pb-36">
                        {(local.videoFondo || local.videoPortada) && (
                          <>
                            {/* Fondo ambiental ligero con imagen estática del primer fotograma (ahorra 50% de decodificadores de video) */}
                            <img
                              src={getVideoPoster(
                                local.videoFondo || local.videoPortada,
                                local.fotoPortada
                              )}
                              alt=""
                              aria-hidden="true"
                              decoding="async"
                              className="pointer-events-none absolute inset-0 h-full w-full object-cover blur-md opacity-55"
                            />
                            {/* Video principal optimizado (faststart) con poster instantáneo del primer fotograma */}
                            <video
                              src={local.videoFondo || local.videoPortada}
                              poster={getVideoPoster(
                                local.videoFondo || local.videoPortada,
                                local.fotoPortada
                              )}
                              preload="auto"
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
                              : "w-44 h-44 md:w-52 md:h-52"
                          } rounded-full shadow-xl border-4 border-white overflow-hidden flex items-center justify-center`}
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
                      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/90" />

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
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-md backdrop-blur-md border ${
                            local.abierto
                              ? "bg-emerald-600/95 text-white border-emerald-400/40"
                              : "bg-rose-600/95 text-white border-rose-400/40"
                          }`}
                        >
                          <span>
                            {local.abierto ? "🟢 Abierto" : "🔴 Cerrado"}
                          </span>
                          <span>•</span>
                          <span>{local.horario || local.tiempoEstimado}</span>
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
              <div className="relative z-10 flex items-center justify-center gap-2 mt-4">
                {locales.map((loc, idx) => (
                  <button
                    key={loc.id}
                    type="button"
                    aria-label={`Enfocar ${loc.nombre}`}
                    onClick={() => setIndiceCoverflow(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === indiceCoverflow
                        ? "bg-primary scale-125 shadow"
                        : "bg-primary/35 hover:bg-primary/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* CHIPS DE FILTRO RÁPIDO STICKY */}
          <section className="w-full bg-white/65 backdrop-blur-md shadow-sm sticky top-20 z-40">
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm rounded-2xl bg-white/80 backdrop-blur-md border border-white/70 p-5 shadow-sm">
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

              <div className="flex items-center gap-space-sm flex-wrap">
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition active:scale-95 shadow-2xs"
                    title="Restablecer búsqueda"
                  >
                    <span>Filtro: "{busqueda}"</span>
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
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
      <footer className="relative z-10 w-full bg-white/85 backdrop-blur-md mt-space-xl border-t border-outline-variant/30">
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
            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Plataforma gastronómica para emprendedores y locales de Tirúa y
                Quidico, Región del Biobío, Chile.
              </p>
              <Link
                href="/superadmin"
                className="text-[11px] font-semibold text-outline hover:text-primary hover:underline"
              >
                Panel SuperAdmin SaaS
              </Link>
            </div>
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

      {/* Modal interactivo de recomendación de platos */}
      <RecomendadorPlatosModal
        isOpen={mostrarRecomendador}
        onClose={() => setMostrarRecomendador(false)}
        locales={locales}
      />
    </div>
  );
}
