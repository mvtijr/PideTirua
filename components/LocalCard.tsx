"use client";

import Link from "next/link";
import {
  Clock,
  MapPin,
  UtensilsCrossed,
  Star,
  ArrowRight,
  QrCode,
  Bike,
} from "lucide-react";
import { Local } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface LocalCardProps {
  local: Local;
  onOpenQr?: (local: Local) => void;
}

export default function LocalCard({ local, onOpenQr }: LocalCardProps) {
  const totalProductos = local.categorias.reduce(
    (acc, cat) => acc + cat.productos.length,
    0
  );

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Foto de portada */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img
          src={local.fotoPortada}
          alt={`Portada de ${local.nombre}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />

        {/* Badges superiores */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${
              local.sector === "Quidico"
                ? "bg-sky-500/90 text-white"
                : "bg-amber-500/95 text-slate-950"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            {local.ubicacion}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-amber-400 backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {local.calificacion.toFixed(1)}
            </span>
            {onOpenQr && (
              <button
                type="button"
                onClick={() => onOpenQr(local)}
                title={`Ver código QR de ${local.nombre}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white hover:text-sky-700"
              >
                <QrCode className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Logo superpuesto e info en portada */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
            <img
              src={local.logo}
              alt={`Logo ${local.nombre}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1 text-white">
            <span className="inline-block rounded bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {local.abierto ? "Abierto ahora" : "Cerrado"}
            </span>
            <h3 className="truncate text-lg font-bold leading-tight drop-shadow-sm">
              {local.nombre}
            </h3>
          </div>
        </div>
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-sky-700">
            <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
            <span>{local.rubro}</span>
          </div>

          <p className=" line-clamp-2 text-sm text-slate-600">
            {local.descripcionCorta}
          </p>
        </div>

        <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              {local.tiempoEstimado}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bike className="h-3.5 w-3.5 text-sky-600" />
              Delivery:{" "}
              <strong className="text-slate-700">
                {local.costoDelivery > 0
                  ? formatCLP(local.costoDelivery)
                  : "Gratis"}
              </strong>
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {totalProductos} platos
            </span>
          </div>

          <Link
            href={`/${local.slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 active:scale-[0.99]"
          >
            <span>Ver Carta</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
