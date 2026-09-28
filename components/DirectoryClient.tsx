"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Fish,
  Coffee,
  Flame,
  Utensils,
  Sparkles,
  X,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { CategoriaFiltro, Local, SectorComuna } from "@/types/local";
import { CATEGORIAS_DIRECTORIO } from "@/lib/locales";
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

  const iconoPorCategoria = (cat: CategoriaFiltro) => {
    switch (cat) {
      case "Sushi":
        return <Sparkles className="h-4 w-4" />;
      case "Comida Rápida":
        return <Flame className="h-4 w-4" />;
      case "Pescados y Mariscos":
        return <Fish className="h-4 w-4" />;
      case "Cafetería":
        return <Coffee className="h-4 w-4" />;
      default:
        return <Utensils className="h-4 w-4" />;
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

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
      {/* Panel de búsqueda y filtros */}
      <div className="-mt-12 relative z-10 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Buscador rápido */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar local, empanadas, sushi, pollo asado, Quidico..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Selector de Sector: Tirúa Centro / Quidico */}
          <div className="flex items-center gap-1.5 self-start rounded-xl bg-slate-100 p-1 text-xs font-semibold sm:self-auto">
            {(["Todos", "Tirúa Centro", "Quidico"] as const).map((sector) => {
              const activo = sectorActivo === sector;
              return (
                <button
                  key={sector}
                  type="button"
                  onClick={() => setSectorActivo(sector)}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 transition ${
                    activo
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {sector !== "Todos" && (
                    <MapPin className="h-3.5 w-3.5 text-sky-600" />
                  )}
                  <span>
                    {sector === "Todos" ? "Toda la Comuna" : sector}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtros por categoría */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIAS_DIRECTORIO.map((categoria) => {
            const activa = categoriaActiva === categoria;
            return (
              <button
                key={categoria}
                type="button"
                onClick={() => setCategoriaActiva(categoria)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                  activa
                    ? "bg-sky-700 text-white shadow-sm ring-2 ring-sky-700/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/50"
                }`}
              >
                {iconoPorCategoria(categoria)}
                <span>{categoria}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cabecera de resultados */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Locales en Tirúa y Quidico
          </h2>
          <p className="text-sm text-slate-600">
            Selecciona un local para abrir su carta digital y pedir directo por
            WhatsApp
          </p>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">
          {localesFiltrados.length}{" "}
          {localesFiltrados.length === 1
            ? "local disponible"
            : "locales disponibles"}
        </span>
      </div>

      {/* Cuadrícula de tarjetas de locales */}
      {localesFiltrados.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {localesFiltrados.map((local) => (
            <LocalCard
              key={local.id}
              local={local}
              onOpenQr={(loc) => setLocalQrModal(loc)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Utensils className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-800">
            No encontramos locales con esos filtros
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Prueba buscando otro plato o restablece las categorías de búsqueda.
          </p>
          <button
            type="button"
            onClick={() => {
              setBusqueda("");
              setCategoriaActiva("Todos");
              setSectorActivo("Todos");
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Ver todos los locales
          </button>
        </div>
      )}

      {/* Modal de Código QR por Local para escaneo en mesas / mostrador */}
      {localQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setLocalQrModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                  <QrCode className="h-3.5 w-3.5" />
                  Menú QR Exclusivo
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {localQrModal.nombre}
                </h3>
                <p className="text-xs text-slate-500">
                  {localQrModal.ubicacion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocalQrModal(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `https://pidetirua.cl/${localQrModal.slug}`
                )}`}
                alt={`QR ${localQrModal.nombre}`}
                className="h-44 w-44 rounded-lg bg-white p-2 shadow-sm"
              />
              <code className="mt-3 rounded bg-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-800">
                /{localQrModal.slug}
              </code>
              <p className="mt-2 text-center text-xs text-slate-500">
                Escanea este QR en mesa o mostrador para abrir directamente el
                menú móvil de <strong>{localQrModal.nombre}</strong>.
              </p>
            </div>

            <Link
              href={`/${localQrModal.slug}`}
              onClick={() => setLocalQrModal(null)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-800"
            >
              <span>Ir al Menú Móvil</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
