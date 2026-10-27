"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Plus, Minus, Check, Sparkles, UtensilsCrossed } from "lucide-react";
import { Producto, GrupoOpcion, OpcionSeleccionada } from "@/types/local";
import { formatCLP, getPrecioEfectivoProducto } from "@/lib/formatters";
import { getLocalTheme } from "@/lib/localTheme";

interface ModalPersonalizarPlatoProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
  localSlug: string;
  onConfirmar: (
    producto: Producto,
    opcionesSeleccionadas: OpcionSeleccionada[],
    cantidad: number
  ) => void;
}

export default function ModalPersonalizarPlato({
  isOpen,
  onClose,
  producto,
  localSlug,
  onConfirmar,
}: ModalPersonalizarPlatoProps) {
  const theme = getLocalTheme(localSlug);
  const [cantidad, setCantidad] = useState(1);
  // Mapa de selecciones: grupoIndex -> array de items seleccionados
  const [selecciones, setSelecciones] = useState<Record<number, string[]>>({});
  const [imgError, setImgError] = useState(false);

  // Inicializar selecciones al abrir con un plato
  useEffect(() => {
    if (!isOpen || !producto) {
      setCantidad(1);
      setSelecciones({});
      setImgError(false);
      return;
    }

    setCantidad(1);
    setImgError(false);

    const initMap: Record<number, string[]> = {};
    const grupos: GrupoOpcion[] = producto.opciones || [];

    grupos.forEach((grupo, idx) => {
      if (grupo.tipo === "unica" && grupo.items.length > 0) {
        // En selección única obligatoria, seleccionamos por defecto la primera opción
        initMap[idx] = [grupo.items[0].nombre];
      } else {
        initMap[idx] = [];
      }
    });

    setSelecciones(initMap);
  }, [isOpen, producto]);

  // Manejador tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const precioBase = useMemo(() => {
    if (!producto) return 0;
    return getPrecioEfectivoProducto(producto);
  }, [producto]);

  const opcionesSeleccionadasList = useMemo(() => {
    if (!producto || !producto.opciones) return [];
    const list: OpcionSeleccionada[] = [];

    producto.opciones.forEach((grupo, gIdx) => {
      const selectedNames = selecciones[gIdx] || [];
      grupo.items.forEach((item) => {
        if (selectedNames.includes(item.nombre)) {
          list.push({
            grupoTitulo: grupo.titulo,
            nombre: item.nombre,
            precio: Number(item.precio) || 0,
          });
        }
      });
    });

    return list;
  }, [producto, selecciones]);

  const precioExtrasUnitario = useMemo(() => {
    return opcionesSeleccionadasList.reduce((acc, op) => acc + op.precio, 0);
  }, [opcionesSeleccionadasList]);

  const precioUnitarioFinal = precioBase + precioExtrasUnitario;
  const precioTotal = precioUnitarioFinal * cantidad;

  if (!isOpen || !producto) return null;

  const grupos = producto.opciones || [];
  const imagenSrc = producto.imagen_url || producto.imagen;

  const handleToggleUnica = (grupoIdx: number, itemNombre: string) => {
    setSelecciones((prev) => ({
      ...prev,
      [grupoIdx]: [itemNombre],
    }));
  };

  const handleToggleMultiple = (grupoIdx: number, itemNombre: string) => {
    setSelecciones((prev) => {
      const actuales = prev[grupoIdx] || [];
      const yaExiste = actuales.includes(itemNombre);
      const nuevos = yaExiste
        ? actuales.filter((n) => n !== itemNombre)
        : [...actuales, itemNombre];
      return {
        ...prev,
        [grupoIdx]: nuevos,
      };
    });
  };

  const handleConfirmar = () => {
    onConfirmar(producto, opcionesSeleccionadasList, cantidad);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Contenedor Modal / Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-personalizar-title"
        className="relative w-full max-h-[92vh] sm:max-h-[85vh] sm:max-w-lg flex flex-col rounded-t-[28px] sm:rounded-3xl bg-stone-50 border border-stone-200/90 shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Cabecera del Modal */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-white/95 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-wide uppercase text-stone-900">
              Personaliza tu plato
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo Scrolleable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Tarjeta resumen del plato base */}
          <div className="flex gap-3.5 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/60">
              {imagenSrc && !imgError ? (
                <img
                  src={imagenSrc}
                  alt={producto.nombre}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-400">
                  <UtensilsCrossed className="h-7 w-7" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center min-w-0">
              <h3
                id="modal-personalizar-title"
                className="font-display text-lg font-bold tracking-wide uppercase text-stone-900 truncate"
              >
                {producto.nombre}
              </h3>
              {producto.descripcion && (
                <p className="line-clamp-2 text-xs text-stone-500 font-body mt-0.5">
                  {producto.descripcion}
                </p>
              )}
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-sm font-extrabold text-amber-600">
                  Base: {formatCLP(precioBase)}
                </span>
                {producto.es_oferta && producto.precio_oferta && (
                  <span className="text-xs text-stone-400 line-through">
                    {formatCLP(producto.precio)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Grupos de Opciones */}
          {grupos.map((grupo, gIdx) => {
            const esUnica = grupo.tipo === "unica";
            const seleccionados = selecciones[gIdx] || [];

            return (
              <div
                key={grupo.id || `${grupo.titulo}-${gIdx}`}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display text-base font-bold tracking-wide uppercase text-stone-900">
                      {grupo.titulo}
                    </h4>
                    <p className="text-xs text-stone-500 font-body">
                      {esUnica
                        ? "Selecciona una opción (obligatoria)"
                        : "Elige las opciones que desees (opcional)"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      esUnica
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-stone-100 text-stone-600 border border-stone-200"
                    }`}
                  >
                    {esUnica ? "1 opción" : "Múltiples"}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {grupo.items.map((item, iIdx) => {
                    const estaSeleccionado = seleccionados.includes(item.nombre);
                    const itemPrecio = Number(item.precio) || 0;

                    return (
                      <button
                        key={`${item.nombre}-${iIdx}`}
                        type="button"
                        onClick={() =>
                          esUnica
                            ? handleToggleUnica(gIdx, item.nombre)
                            : handleToggleMultiple(gIdx, item.nombre)
                        }
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left border transition-all ${
                          estaSeleccionado
                            ? "border-amber-500 bg-amber-50/70 shadow-sm"
                            : "border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Radio o Checkbox visual */}
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-all ${
                              esUnica ? "rounded-full" : "rounded-md"
                            } ${
                              estaSeleccionado
                                ? "border-amber-600 bg-amber-600 text-white"
                                : "border-stone-300 bg-white"
                            }`}
                          >
                            {estaSeleccionado && (
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            )}
                          </div>
                          <span
                            className={`text-sm truncate font-medium ${
                              estaSeleccionado
                                ? "text-stone-900 font-semibold"
                                : "text-stone-700"
                            }`}
                          >
                            {item.nombre}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold shrink-0 ml-2 tabular-nums ${
                            itemPrecio > 0 ? "text-amber-700" : "text-stone-400"
                          }`}
                        >
                          {itemPrecio > 0
                            ? `+${formatCLP(itemPrecio)}`
                            : "Gratis"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Barra Inferior Fija de Cantidad y Agregar */}
        <div className="sticky bottom-0 z-20 border-t border-stone-200 bg-white px-5 py-4 shadow-lg backdrop-blur-md safe-bottom">
          <div className="flex items-center gap-4">
            {/* Control de Cantidad */}
            <div className="flex items-center rounded-full border border-stone-300 bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                disabled={cantidad <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm disabled:opacity-40 transition-transform active:scale-95"
                aria-label="Disminuir cantidad"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-9 text-center font-display text-lg font-bold text-stone-900 tabular-nums">
                {cantidad}
              </span>
              <button
                type="button"
                onClick={() => setCantidad((prev) => prev + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm transition-transform active:scale-95"
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Botón Destacado Agregar al Pedido */}
            <button
              type="button"
              onClick={handleConfirmar}
              className="flex-1 flex items-center justify-center gap-2 rounded-full py-3.5 px-4 font-display text-base font-bold tracking-wide uppercase text-white bg-[#EA580C] hover:bg-[#c2410c] shadow-md transition-all active:scale-98"
            >
              <span>Agregar al pedido</span>
              <span className="opacity-60">•</span>
              <span className="font-mono text-sm tracking-normal tabular-nums">
                {formatCLP(precioTotal)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
