"use client";

import { Plus, Minus, Sparkles } from "lucide-react";
import { Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface ProductCardProps {
  producto: Producto;
  cantidadEnCarrito: number;
  onAgregar: (producto: Producto) => void;
  onDisminuir: (productoId: string) => void;
}

export default function ProductCard({
  producto,
  cantidadEnCarrito,
  onAgregar,
  onDisminuir,
}: ProductCardProps) {
  return (
    <div
      className={`group relative flex gap-3.5 rounded-2xl border p-3.5 transition-all sm:gap-4 sm:p-4 ${
        cantidadEnCarrito > 0
          ? "border-sky-500/60 bg-sky-50/30 shadow-sm"
          : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {/* Información del producto */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            {producto.etiqueta && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                <Sparkles className="h-3 w-3 text-amber-600" />
                {producto.etiqueta}
              </span>
            )}
            {cantidadEnCarrito > 0 && (
              <span className="inline-flex items-center rounded-full bg-sky-700 px-2 py-0.5 text-[11px] font-bold text-white">
                {cantidadEnCarrito} en tu pedido
              </span>
            )}
          </div>

          <h4 className="mt-1 text-base font-bold leading-snug text-slate-900">
            {producto.nombre}
          </h4>

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {producto.descripcion}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
            {formatCLP(producto.precio)}
          </span>

          {/* Controles de agregar o modificar cantidad */}
          {cantidadEnCarrito === 0 ? (
            <button
              type="button"
              onClick={() => onAgregar(producto)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => onDisminuir(producto.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
                aria-label={`Quitar una unidad de ${producto.nombre}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[1.25rem] text-center text-sm font-extrabold text-slate-900">
                {cantidadEnCarrito}
              </span>
              <button
                type="button"
                onClick={() => onAgregar(producto)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-700 text-white transition hover:bg-sky-800 active:scale-95"
                aria-label={`Agregar otra unidad de ${producto.nombre}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Imagen del producto */}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-32 sm:w-32">
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
    </div>
  );
}
