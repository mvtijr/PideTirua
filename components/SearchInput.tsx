"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, Store, UtensilsCrossed, ArrowRight } from "lucide-react";
import { Local, Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  locales?: Local[];
}

export default function SearchInput({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = "Buscar local, sushi, empanadas, abierto ahora...",
  className = "",
  locales = [],
}: SearchInputProps) {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLimpiar = () => {
    onChange("");
    onClear?.();
    setDropdownAbierto(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setDropdownAbierto(false);
      onSubmit?.();
    } else if (e.key === "Escape") {
      setDropdownAbierto(false);
    }
  };

  // Cálculo de resultados en vivo para el dropdown interactivo
  const resultadosEnVivo = (() => {
    const q = value.trim().toLowerCase();
    if (!q || locales.length === 0) return { locales: [], platos: [] };

    const localesEncontrados: Local[] = [];
    const platosEncontrados: Array<{
      localSlug: string;
      localNombre: string;
      producto: Producto;
    }> = [];

    const filtrarSoloAbiertos = q.includes("abierto") || q.includes("abiertos");
    const queryLimpia = q
      .replace(/\babiertos\b/g, "")
      .replace(/\babierto\b/g, "")
      .replace(/\bahora\b/g, "")
      .trim();

    for (const loc of locales) {
      if (loc.activo === false) continue;
      if (filtrarSoloAbiertos && !loc.abierto) continue;

      const coincideLocal =
        !queryLimpia ||
        loc.nombre.toLowerCase().includes(queryLimpia) ||
        loc.rubro.toLowerCase().includes(queryLimpia) ||
        loc.ubicacion.toLowerCase().includes(queryLimpia);

      if (coincideLocal && localesEncontrados.length < 3) {
        localesEncontrados.push(loc);
      }

      // Buscar platos coincidentes
      for (const cat of loc.categorias) {
        for (const prod of cat.productos) {
          if (prod.disponible === false) continue;
          const textoPlato = `${prod.nombre} ${prod.descripcion} ${cat.nombre}`.toLowerCase();
          if (queryLimpia && textoPlato.includes(queryLimpia)) {
            if (platosEncontrados.length < 4) {
              platosEncontrados.push({
                localSlug: loc.slug,
                localNombre: loc.nombre,
                producto: prod,
              });
            }
          }
        }
      }
    }

    return { locales: localesEncontrados, platos: platosEncontrados };
  })();

  const tieneResultadosEnVivo =
    value.trim().length > 0 &&
    (resultadosEnVivo.locales.length > 0 || resultadosEnVivo.platos.length > 0);

  return (
    <div ref={contenedorRef} className={`relative flex items-center w-full ${className}`}>
      {/* Icono de Lupa */}
      <span className="pointer-events-none absolute left-3 flex items-center text-slate-400">
        <Search className="h-4 w-4" />
      </span>

      {/* Input de Texto */}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setDropdownAbierto(true);
        }}
        onFocus={() => {
          if (value.trim()) setDropdownAbierto(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-base sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs"
      />

      {/* Botón Limpiar búsqueda */}
      {value && (
        <button
          type="button"
          onClick={handleLimpiar}
          className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition active:scale-95"
          title="Limpiar búsqueda"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* DROPDOWN FLOTANTE DE RESULTADOS Y SUGERENCIAS EN VIVO */}
      {dropdownAbierto && tieneResultadosEnVivo && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900">
          <div className="max-h-80 overflow-y-auto p-2 space-y-2">
            {/* Locales Encontrados */}
            {resultadosEnVivo.locales.length > 0 && (
              <div>
                <span className="block px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Restaurantes y Locales
                </span>
                <div className="space-y-1">
                  {resultadosEnVivo.locales.map((loc) => (
                    <Link
                      key={loc.id}
                      href={`/${loc.slug}`}
                      onClick={() => setDropdownAbierto(false)}
                      className="flex items-center justify-between rounded-xl p-2 hover:bg-amber-50 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={loc.logo || "/logo-pidetirua.jpg"}
                          alt={loc.nombre}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200 bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 group-hover:text-amber-700 truncate">
                            {loc.nombre}
                          </p>
                          <p className="text-[11px] text-slate-600 truncate">
                            {loc.rubro} · {loc.ubicacion}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                            loc.abierto
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {loc.abierto ? "Abierto" : "Cerrado"}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Platos Encontrados */}
            {resultadosEnVivo.platos.length > 0 && (
              <div className="border-t border-slate-100 pt-2">
                <span className="block px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Platos Disponibles en la Carta
                </span>
                <div className="space-y-1">
                  {resultadosEnVivo.platos.map((item, idx) => (
                    <Link
                      key={`${item.localSlug}-${item.producto.id}-${idx}`}
                      href={`/${item.localSlug}`}
                      onClick={() => setDropdownAbierto(false)}
                      className="flex items-center justify-between rounded-xl p-2 hover:bg-amber-50 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.producto.imagen_url || item.producto.imagen ? (
                          <div className="relative h-9 w-9 shrink-0">
                            <img
                              src={item.producto.imagen_url || item.producto.imagen}
                              alt={item.producto.nombre}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback");
                                if (fallback) (fallback as HTMLElement).style.display = "flex";
                              }}
                              className="h-9 w-9 rounded-lg object-cover bg-slate-100"
                            />
                            <div className="img-fallback hidden h-9 w-9 rounded-lg bg-amber-100 items-center justify-center text-amber-700">
                              <UtensilsCrossed className="h-4 w-4" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                            <UtensilsCrossed className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 truncate">
                            {item.producto.nombre}
                          </p>
                          <p className="text-[11px] text-slate-600 truncate">
                            en {item.localNombre}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs font-black text-emerald-700">
                          {formatCLP(
                            item.producto.es_oferta && item.producto.precio_oferta
                              ? item.producto.precio_oferta
                              : item.producto.precio
                          )}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botón inferior para ir a todos los resultados en el directorio */}
          <button
            type="button"
            onClick={() => {
              setDropdownAbierto(false);
              onSubmit?.();
            }}
            className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-amber-100 hover:text-amber-900 transition"
          >
            <span>Ver todos los resultados en el directorio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
