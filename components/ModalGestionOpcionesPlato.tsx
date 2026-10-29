"use client";

import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Check,
  HelpCircle,
} from "lucide-react";
import { GrupoOpcion, Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface ModalGestionOpcionesPlatoProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
  onGuardar: (productoId: string, opciones: GrupoOpcion[]) => Promise<void>;
}

export default function ModalGestionOpcionesPlato({
  isOpen,
  onClose,
  producto,
  onGuardar,
}: ModalGestionOpcionesPlatoProps) {
  const [grupos, setGrupos] = useState<GrupoOpcion[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && producto) {
      setGrupos(
        Array.isArray(producto.opciones)
          ? JSON.parse(JSON.stringify(producto.opciones))
          : []
      );
      setError(null);
    }
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

  if (!isOpen || !producto) return null;

  const handleAgregarGrupo = () => {
    setGrupos((prev) => [
      ...prev,
      {
        titulo: "",
        tipo: "unica",
        items: [{ nombre: "", precio: 0 }],
      },
    ]);
  };

  const handleEliminarGrupo = (gIdx: number) => {
    setGrupos((prev) => prev.filter((_, idx) => idx !== gIdx));
  };

  const handleCambiarTituloGrupo = (gIdx: number, titulo: string) => {
    setGrupos((prev) =>
      prev.map((g, idx) => (idx === gIdx ? { ...g, titulo } : g))
    );
  };

  const handleCambiarTipoGrupo = (gIdx: number, tipo: "unica" | "multiple") => {
    setGrupos((prev) =>
      prev.map((g, idx) => (idx === gIdx ? { ...g, tipo } : g))
    );
  };

  const handleAgregarItem = (gIdx: number) => {
    setGrupos((prev) =>
      prev.map((g, idx) =>
        idx === gIdx
          ? {
              ...g,
              items: [...g.items, { nombre: "", precio: 0 }],
            }
          : g
      )
    );
  };

  const handleEliminarItem = (gIdx: number, iIdx: number) => {
    setGrupos((prev) =>
      prev.map((g, idx) =>
        idx === gIdx
          ? {
              ...g,
              items: g.items.filter((_, itemIndex) => itemIndex !== iIdx),
            }
          : g
      )
    );
  };

  const handleCambiarItemNombre = (
    gIdx: number,
    iIdx: number,
    nombre: string
  ) => {
    setGrupos((prev) =>
      prev.map((g, idx) =>
        idx === gIdx
          ? {
              ...g,
              items: g.items.map((it, itemIndex) =>
                itemIndex === iIdx ? { ...it, nombre } : it
              ),
            }
          : g
      )
    );
  };

  const handleCambiarItemPrecio = (
    gIdx: number,
    iIdx: number,
    precioStr: string
  ) => {
    const num = Math.max(0, Number(precioStr.replace(/[^0-9]/g, "")) || 0);
    setGrupos((prev) =>
      prev.map((g, idx) =>
        idx === gIdx
          ? {
              ...g,
              items: g.items.map((it, itemIndex) =>
                itemIndex === iIdx ? { ...it, precio: num } : it
              ),
            }
          : g
      )
    );
  };

  const handleGuardar = async () => {
    // Validar que cada grupo tenga título
    for (const [i, g] of grupos.entries()) {
      if (!g.titulo.trim()) {
        setError(`El grupo #${i + 1} debe tener un título (ej: "Elige tu salsa").`);
        return;
      }
      // Filtrar items vacíos
      const itemsValidos = g.items.filter((it) => it.nombre.trim());
      if (itemsValidos.length === 0) {
        setError(
          `El grupo "${g.titulo}" debe tener al menos una opción válida con nombre.`
        );
        return;
      }
    }

    // Normalizar grupos limpios
    const gruposLimpios: GrupoOpcion[] = grupos.map((g) => ({
      titulo: g.titulo.trim(),
      tipo: g.tipo,
      items: g.items
        .filter((it) => it.nombre.trim())
        .map((it) => ({
          nombre: it.nombre.trim(),
          precio: Math.max(0, Math.round(Number(it.precio) || 0)),
        })),
    }));

    setError(null);
    setGuardando(true);
    try {
      await onGuardar(producto.id, gruposLimpios);
      onClose();
    } catch {
      setError("Error al guardar las opciones del plato.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-opciones-plato-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Contenedor Modal */}
      <div className="relative w-full max-w-xl rounded-3xl bg-stone-50 border border-stone-200/90 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3
                id="modal-opciones-plato-titulo"
                className="font-display text-lg font-bold uppercase tracking-wide text-stone-900 leading-tight"
              >
                ⚙️ Personalización y Extras del Plato
              </h3>
              <p className="text-xs font-semibold text-stone-500 truncate max-w-xs sm:max-w-md">
                {producto.nombre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de opciones"
            className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Configura grupos de opciones para que el cliente elija aderezos,
            acompañamientos o extras al añadir este plato a su pedido.
          </p>

          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {grupos.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white p-6 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-amber-500/70" />
              <p className="mt-2 text-sm font-bold text-stone-800">
                Este plato aún no tiene extras ni opciones.
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Haz clic abajo para agregar tu primer grupo (ej: &quot;Elige tu salsa&quot; o &quot;Agregados extras&quot;).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {grupos.map((grupo, gIdx) => (
                <div
                  key={gIdx}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Grupo #{gIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEliminarGrupo(gIdx)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                      aria-label={`Eliminar grupo ${gIdx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar grupo</span>
                    </button>
                  </div>

                  {/* Título y Tipo de Selección */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                        Título del grupo *
                      </label>
                      <input
                        type="text"
                        value={grupo.titulo}
                        onChange={(e) =>
                          handleCambiarTituloGrupo(gIdx, e.target.value)
                        }
                        placeholder="Ej: Elige tu salsa o Agregados"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                        Tipo de selección *
                      </label>
                      <select
                        value={grupo.tipo}
                        onChange={(e) =>
                          handleCambiarTipoGrupo(
                            gIdx,
                            e.target.value as "unica" | "multiple"
                          )
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                      >
                        <option value="unica">
                          Una sola opción obligatoria (Radio)
                        </option>
                        <option value="multiple">
                          Múltiples opciones opcionales (Checkboxes)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Lista de Ítems */}
                  <div className="space-y-2 pt-1 border-t border-stone-100">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600">
                      Opciones / Ítems disponibles:
                    </label>

                    {grupo.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={item.nombre}
                          onChange={(e) =>
                            handleCambiarItemNombre(gIdx, iIdx, e.target.value)
                          }
                          placeholder="Nombre (ej: Mayo Casera)"
                          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                        />

                        <div className="relative w-28 shrink-0">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                            +$
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={item.precio || ""}
                            onChange={(e) =>
                              handleCambiarItemPrecio(gIdx, iIdx, e.target.value)
                            }
                            placeholder="0 (Gratis)"
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-6 pr-2 text-xs font-bold text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEliminarItem(gIdx, iIdx)}
                          className="flex min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Eliminar opción"
                          aria-label={`Eliminar opción ${item.nombre || iIdx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAgregarItem(gIdx)}
                      className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span>+ Agregar otra opción a este grupo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleAgregarGrupo}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 py-3 text-xs font-display uppercase tracking-wider text-stone-700 hover:border-stone-400 hover:bg-white transition active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 text-amber-600" />
            <span>+ Agregar Nuevo Grupo de Opciones</span>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 bg-white px-5 py-4 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 hover:bg-black text-white px-4 py-3 text-xs sm:text-sm font-display uppercase tracking-wider shadow-md transition active:scale-95 disabled:opacity-50"
          >
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando opciones...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Guardar Personalización y Extras</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-3 text-xs font-bold transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
