"use client";

import { useState, memo } from "react";
import { Plus, Minus, Sparkles, Ban, Flame, Check, UtensilsCrossed } from "lucide-react";
import { Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";
import { getLocalTheme } from "@/lib/localTheme";

interface ProductCardProps {
  producto: Producto;
  cantidadEnCarrito: number;
  onAgregar: (producto: Producto) => void;
  onPersonalizar?: (producto: Producto) => void;
  onDisminuir: (productoId: string) => void;
  localSlug: string;
}

export default memo(function ProductCard({
  producto,
  cantidadEnCarrito,
  onAgregar,
  onPersonalizar,
  onDisminuir,
  localSlug,
}: ProductCardProps) {
  const [agregadoFeedback, setAgregadoFeedback] = useState(false);
  const [imagenError, setImagenError] = useState(false);
  const theme = getLocalTheme(localSlug);
  const disponible = producto.disponible !== false;
  const imagenSrc = producto.imagen_url || producto.imagen;
  const tieneOpciones = Boolean(
    producto.opciones && producto.opciones.length > 0
  );
  const tieneOferta =
    Boolean(producto.es_oferta) &&
    typeof producto.precio_oferta === "number" &&
    producto.precio_oferta > 0 &&
    producto.precio_oferta < producto.precio;
  const precioCobro = tieneOferta ? producto.precio_oferta! : producto.precio;

  const handleAgregarClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!disponible) return;

    if (tieneOpciones && onPersonalizar) {
      onPersonalizar(producto);
      return;
    }

    onAgregar(producto);
    setAgregadoFeedback(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Ignorar si el navegador restringe vibración sin interacción previa
      }
    }
    setTimeout(() => setAgregadoFeedback(false), 700);
  };

  return (
    <div
      onClick={() => {
        if (disponible && tieneOpciones && onPersonalizar) {
          onPersonalizar(producto);
        }
      }}
      className={`content-auto-dish group relative flex gap-3.5 rounded-2xl border p-3.5 transition-all sm:gap-4 sm:p-4 ${
        tieneOpciones && disponible ? "cursor-pointer" : ""
      } ${
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
            {/* Indicador circular de estado (verde disponible / ámbar oferta / gris agotado) */}
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                !disponible
                  ? "bg-slate-300"
                  : tieneOferta
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500"
              }`}
              title={!disponible ? "Agotado" : tieneOferta ? "En Oferta" : "Disponible"}
            />
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
            {disponible && tieneOpciones && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                <Sparkles className="h-3 w-3 text-amber-600" />
                Personalizable
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
                className={`tabular-nums inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${theme.cardInCartBadge}`}
              >
                {cantidadEnCarrito} en tu pedido
              </span>
            )}
          </div>

          <h4
            className={`mt-1 font-display text-lg sm:text-xl font-bold tracking-wide uppercase leading-tight ${
              !disponible
                ? "text-slate-500 line-through decoration-slate-400"
                : theme.cardTitle
            }`}
          >
            {producto.nombre}
          </h4>

          <p
            className={`mt-1 line-clamp-2 font-body text-xs leading-relaxed sm:text-sm ${
              !disponible ? "text-slate-400" : "text-stone-600"
            }`}
          >
            {producto.descripcion}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {tieneOferta && disponible && (
              <span className="text-xs font-bold text-stone-500 line-through decoration-rose-400 tabular-nums">
                {formatCLP(producto.precio)}
              </span>
            )}
            <span
              className={`text-base font-extrabold tracking-tight sm:text-lg tabular-nums ${
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

          {/* Controles de agregar o modificar cantidad (Mínimo 48px táctil) */}
          {!disponible ? (
            <button
              type="button"
              disabled
              className="inline-flex min-h-[44px] cursor-not-allowed items-center gap-1.5 rounded-full border border-slate-300 bg-slate-200/90 px-4 py-2 text-xs font-bold text-slate-500 shadow-none opacity-80"
            >
              <Ban className="h-4 w-4" />
              <span>Agotado</span>
            </button>
          ) : tieneOpciones ? (
            cantidadEnCarrito === 0 ? (
              <button
                type="button"
                onClick={handleAgregarClick}
                className={`inline-flex min-h-[44px] min-w-[104px] items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs sm:text-sm font-extrabold shadow-sm transition-all active:scale-95 ${theme.cardAddBtn}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Personalizar</span>
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 shadow-sm"
              >
                <span className="tabular-nums text-xs font-bold text-amber-900">
                  {cantidadEnCarrito} agregado{cantidadEnCarrito > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={handleAgregarClick}
                  className="flex min-h-[44px] min-w-[44px] h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-600 text-white font-bold transition active:scale-90 hover:bg-amber-700 shadow-sm"
                  title="Agregar otra personalización"
                  aria-label="Agregar otra personalización"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )
          ) : cantidadEnCarrito === 0 ? (
            <button
              type="button"
              onClick={handleAgregarClick}
              className={`inline-flex min-h-[44px] min-w-[104px] items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs sm:text-sm font-extrabold shadow-sm transition-all active:scale-95 ${
                agregadoFeedback
                  ? "bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400 scale-105"
                  : theme.cardAddBtn
              }`}
            >
              {agregadoFeedback ? (
                <>
                  <Check className="h-4 w-4 transition-transform duration-200 scale-110 text-white" />
                  <span>¡Agregado!</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>+ Agregar</span>
                </>
              )}
            </button>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-stone-300 bg-white px-2 py-1 shadow-sm ${theme.cardCounterBox}`}
            >
              <button
                type="button"
                onClick={() => onDisminuir(producto.id)}
                className={`flex min-h-[44px] min-w-[44px] h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-full transition active:scale-90 ${theme.cardMinusBtn}`}
                aria-label={`Quitar una unidad de ${producto.nombre}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className={`min-w-[1.75rem] text-center text-sm font-black ${theme.cardQtyText}`}
              >
                {cantidadEnCarrito}
              </span>
              <button
                type="button"
                onClick={handleAgregarClick}
                className={`flex min-h-[44px] min-w-[44px] h-11 w-11 sm:h-10 sm:w-10 items-center justify-center rounded-full transition active:scale-90 ${theme.cardPlusBtn}`}
                aria-label={`Agregar otra unidad de ${producto.nombre}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Imagen del producto */}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-stone-100 sm:h-32 sm:w-32 border border-stone-200/80">
        {tieneOferta && disponible && (
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 rounded-lg bg-rose-600/95 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-xs animate-pulse">
            <Flame className="h-3 w-3 fill-white text-white" />
            <span>{producto.texto_promo || "OFERTA"}</span>
          </div>
        )}
        {imagenError || !imagenSrc ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center border border-slate-200">
            <UtensilsCrossed className="h-7 w-7 text-slate-400" />
            <span className="mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-tight line-clamp-1">
              {producto.nombre}
            </span>
          </div>
        ) : (
          <img
            src={imagenSrc}
            alt={producto.nombre}
            onError={() => setImagenError(true)}
            className={`h-full w-full object-cover transition-transform duration-300 ${
              !disponible
                ? "grayscale opacity-60"
                : "group-hover:scale-105"
            }`}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        )}
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
});
