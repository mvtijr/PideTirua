"use client";

import { Plus, Minus, Sparkles } from "lucide-react";
import { Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface ProductCardProps {
  producto: Producto;
  cantidadEnCarrito: number;
  onAgregar: (producto: Producto) => void;
  onDisminuir: (productoId: string) => void;
  esLasTranqueras?: boolean;
}

export default function ProductCard({
  producto,
  cantidadEnCarrito,
  onAgregar,
  onDisminuir,
  esLasTranqueras = false,
}: ProductCardProps) {
  return (
    <div
      className={`group relative flex gap-3.5 rounded-2xl border p-3.5 transition-all sm:gap-4 sm:p-4 ${
        esLasTranqueras
          ? cantidadEnCarrito > 0
            ? "border-[#F8DC4B] bg-[#FFFDF0] shadow-sm ring-1 ring-[#F8DC4B]"
            : "border-[#F8DC4B]/40 bg-white hover:border-[#171614]/40 hover:shadow-md"
          : cantidadEnCarrito > 0
          ? "border-secondary bg-surface-container-low shadow-sm"
          : "border-outline-variant/40 bg-surface-container-lowest hover:border-secondary/50 hover:shadow-md"
      }`}
    >
      {/* Información del producto */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            {producto.etiqueta && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  esLasTranqueras
                    ? "bg-[#F8DC4B] text-[#171614]"
                    : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                }`}
              >
                <Sparkles
                  className={`h-3 w-3 ${
                    esLasTranqueras ? "text-[#171614]" : "text-tertiary"
                  }`}
                />
                {producto.etiqueta}
              </span>
            )}
            {cantidadEnCarrito > 0 && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  esLasTranqueras
                    ? "bg-[#171614] text-[#F8DC4B]"
                    : "bg-primary text-on-primary"
                }`}
              >
                {cantidadEnCarrito} en tu pedido
              </span>
            )}
          </div>

          <h4
            className={`mt-1 font-headline-sm text-base font-bold leading-snug ${
              esLasTranqueras ? "text-[#171614]" : "text-primary"
            }`}
          >
            {producto.nombre}
          </h4>

          <p className="mt-1 line-clamp-2 font-body-sm text-xs leading-relaxed text-on-surface-variant sm:text-sm">
            {producto.descripcion}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={`text-base font-extrabold tracking-tight sm:text-lg ${
              esLasTranqueras ? "text-[#171614]" : "text-tertiary"
            }`}
          >
            {formatCLP(producto.precio)}
          </span>

          {/* Controles de agregar o modificar cantidad */}
          {cantidadEnCarrito === 0 ? (
            <button
              type="button"
              onClick={() => onAgregar(producto)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 ${
                esLasTranqueras
                  ? "bg-[#171614] text-[#F8DC4B] hover:bg-neutral-800"
                  : "bg-primary text-on-primary hover:bg-primary-container"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          ) : (
            <div
              className={`inline-flex items-center gap-2 rounded-xl border bg-surface-container-lowest p-1 shadow-sm ${
                esLasTranqueras
                  ? "border-[#F8DC4B]"
                  : "border-outline-variant/50"
              }`}
            >
              <button
                type="button"
                onClick={() => onDisminuir(producto.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-95 ${
                  esLasTranqueras
                    ? "bg-[#FEF9C3] text-[#171614] hover:bg-[#F8DC4B]"
                    : "bg-surface-container text-primary hover:bg-surface-container-high"
                }`}
                aria-label={`Quitar una unidad de ${producto.nombre}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span
                className={`min-w-[1.25rem] text-center text-sm font-extrabold ${
                  esLasTranqueras ? "text-[#171614]" : "text-primary"
                }`}
              >
                {cantidadEnCarrito}
              </span>
              <button
                type="button"
                onClick={() => onAgregar(producto)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-95 ${
                  esLasTranqueras
                    ? "bg-[#171614] text-[#F8DC4B] hover:bg-neutral-800"
                    : "bg-primary text-on-primary hover:bg-primary-container"
                }`}
                aria-label={`Agregar otra unidad de ${producto.nombre}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Imagen del producto */}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-container sm:h-32 sm:w-32">
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
