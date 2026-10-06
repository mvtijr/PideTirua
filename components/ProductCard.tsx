"use client";

import { Plus, Minus, Sparkles, Ban, Flame } from "lucide-react";
import { Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";
import { getLocalTheme } from "@/lib/localTheme";

interface ProductCardProps {
  producto: Producto;
  cantidadEnCarrito: number;
  onAgregar: (producto: Producto) => void;
  onDisminuir: (productoId: string) => void;
  localSlug: string;
}

export default function ProductCard({
  producto,
  cantidadEnCarrito,
  onAgregar,
  onDisminuir,
  localSlug,
}: ProductCardProps) {
  const theme = getLocalTheme(localSlug);
  const disponible = producto.disponible !== false;
  const imagenSrc = producto.imagen_url || producto.imagen;
  const tieneOferta =
    Boolean(producto.es_oferta) &&
    typeof producto.precio_oferta === "number" &&
    producto.precio_oferta > 0 &&
    producto.precio_oferta < producto.precio;
  const precioCobro = tieneOferta ? producto.precio_oferta! : producto.precio;

  return (
    <div
      className={`group relative flex gap-3.5 rounded-2xl border p-3.5 transition-all sm:gap-4 sm:p-4 ${
        !disponible
          ? "border-slate-200 bg-slate-100 opacity-75"
          : cantidadEnCarrito > 0
          ? `bg-white ${theme.cardActive}`
          : `bg-white ${theme.cardInactive}`
      }`}
    >
      {/* Información del producto */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            {!disponible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-300 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
                <Ban className="h-3 w-3 text-slate-600" />
                Agotado
              </span>
            )}
            {disponible && tieneOferta && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-700 border border-rose-200">
                <Flame className="h-3 w-3 text-rose-600 fill-rose-600" />
                {producto.texto_promo || "Promo del Día"}
              </span>
            )}
            {disponible && producto.etiqueta && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${theme.cardTag}`}
              >
                <Sparkles className={`h-3 w-3 ${theme.cardTagIcon}`} />
                {producto.etiqueta}
              </span>
            )}
            {disponible && cantidadEnCarrito > 0 && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${theme.cardInCartBadge}`}
              >
                {cantidadEnCarrito} en tu pedido
              </span>
            )}
          </div>

          <h4
            className={`mt-1 font-headline-sm text-base font-bold leading-snug ${
              !disponible
                ? "text-slate-500 line-through decoration-slate-400"
                : theme.cardTitle
            }`}
          >
            {producto.nombre}
          </h4>

          <p
            className={`mt-1 line-clamp-2 font-body-sm text-xs leading-relaxed sm:text-sm ${
              !disponible ? "text-slate-400" : "text-on-surface-variant"
            }`}
          >
            {producto.descripcion}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {tieneOferta && disponible && (
              <span className="text-xs font-bold text-slate-400 line-through decoration-rose-400">
                {formatCLP(producto.precio)}
              </span>
            )}
            <span
              className={`text-base font-extrabold tracking-tight sm:text-lg ${
                !disponible
                  ? "text-slate-400"
                  : tieneOferta
                  ? "text-rose-600 font-black"
                  : theme.cardPrice
              }`}
            >
              {formatCLP(precioCobro)}
            </span>
          </div>

          {/* Controles de agregar o modificar cantidad */}
          {!disponible ? (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-500"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Agotado</span>
            </button>
          ) : cantidadEnCarrito === 0 ? (
            <button
              type="button"
              onClick={() => onAgregar(producto)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 ${theme.cardAddBtn}`}
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          ) : (
            <div
              className={`inline-flex items-center gap-2 rounded-xl border bg-surface-container-lowest p-1 shadow-sm ${theme.cardCounterBox}`}
            >
              <button
                type="button"
                onClick={() => onDisminuir(producto.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-95 ${theme.cardMinusBtn}`}
                aria-label={`Quitar una unidad de ${producto.nombre}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span
                className={`min-w-[1.25rem] text-center text-sm font-extrabold ${theme.cardQtyText}`}
              >
                {cantidadEnCarrito}
              </span>
              <button
                type="button"
                onClick={() => onAgregar(producto)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-95 ${theme.cardPlusBtn}`}
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
        {tieneOferta && disponible && (
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 rounded-lg bg-rose-600/95 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-xs animate-pulse">
            <Flame className="h-3 w-3 fill-white text-white" />
            <span>{producto.texto_promo || "OFERTA"}</span>
          </div>
        )}
        <img
          src={imagenSrc}
          alt={producto.nombre}
          className={`h-full w-full object-cover transition-transform duration-300 ${
            !disponible
              ? "grayscale opacity-60"
              : "group-hover:scale-105"
          }`}
          loading="lazy"
        />
        {!disponible && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/45 backdrop-blur-[1px]">
            <span className="rounded-full bg-slate-900/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
              Agotado
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
