"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Search,
  X,
  Loader2,
  Sparkles,
  Store,
  UtensilsCrossed,
  ArrowRight,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Local, Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface VoiceSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  locales?: Local[];
}

export default function VoiceSearchInput({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = "Buscar local, sushi, empanadas, abierto ahora...",
  className = "",
  locales = [],
}: VoiceSearchInputProps) {
  const [modalVozAbierto, setModalVozAbierto] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [transcripcionVoz, setTranscripcionVoz] = useState("");
  const [errorVoz, setErrorVoz] = useState<string | null>(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const contenedorRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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

  // Detener reconocimiento al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorar
        }
      }
    };
  }, []);

  // Iniciar reconocimiento de voz con instancia fresca
  const abrirModalVoz = () => {
    setModalVozAbierto(true);
    setTranscripcionVoz("");
    setErrorVoz(null);
    iniciarGrabacionVoz();
  };

  const iniciarGrabacionVoz = () => {
    setErrorVoz(null);

    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorVoz(
        "Tu navegador no soporta entrada de voz. Puedes usar los accesos directos o escribir tu búsqueda."
      );
      return;
    }

    try {
      // Detener anterior si existía
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorar
        }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "es-CL";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setEscuchando(true);
        setErrorVoz(null);
      };

      recognition.onresult = (event: any) => {
        let texto = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          texto += event.results[i][0].transcript;
        }
        if (texto) {
          setTranscripcionVoz(texto);
        }
      };

      recognition.onerror = (event: any) => {
        setEscuchando(false);
        if (event.error === "not-allowed") {
          setErrorVoz(
            "Permiso de micrófono denegado. Habilita el acceso en tu navegador para hablar."
          );
        } else if (event.error === "no-speech") {
          setErrorVoz(
            "No se detectó audio. Pulsa el micrófono para hablar de nuevo."
          );
        } else {
          setErrorVoz("No se pudo capturar el audio. Inténtalo nuevamente.");
        }
      };

      recognition.onend = () => {
        setEscuchando(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setEscuchando(false);
      setErrorVoz("No se pudo iniciar el micrófono: " + (err?.message || "error"));
    }
  };

  const detenerGrabacionVoz = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar
      }
    }
    setEscuchando(false);
  };

  const aplicarBusquedaVoz = (termino: string) => {
    detenerGrabacionVoz();
    const textoLimpio = termino.trim();
    if (!textoLimpio) return;

    onChange(textoLimpio);
    setModalVozAbierto(false);
    setDropdownAbierto(false);

    // Desplazar automáticamente a los resultados
    setTimeout(() => {
      onSubmit?.();
    }, 120);
  };

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
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-20 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs"
      />

      {/* Acciones en la parte derecha del input */}
      <div className="absolute right-2 flex items-center gap-1">
        {/* Botón Limpiar búsqueda */}
        {value && (
          <button
            type="button"
            onClick={handleLimpiar}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition active:scale-95"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Botón Micrófono para Búsqueda por Voz (Abre Modal de Voz) */}
        <button
          type="button"
          onClick={abrirModalVoz}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-2xs"
          title="Buscar con tu voz"
          aria-label="Buscar con tu voz"
        >
          <Mic className="h-4 w-4" />
        </button>
      </div>

      {/* DROPDOWN FLOTANTE DE RESULTADOS Y SUGERENCIAS EN VIVO */}
      {dropdownAbierto && tieneResultadosEnVivo && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900">
          <div className="max-h-80 overflow-y-auto p-2 space-y-2">
            {/* Locales Encontrados */}
            {resultadosEnVivo.locales.length > 0 && (
              <div>
                <span className="block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                          <p className="text-[10px] text-slate-500 truncate">
                            {loc.rubro} · {loc.ubicacion}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
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
                <span className="block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                          <img
                            src={item.producto.imagen_url || item.producto.imagen}
                            alt={item.producto.nombre}
                            className="h-9 w-9 rounded-lg object-cover shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                            <UtensilsCrossed className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 truncate">
                            {item.producto.nombre}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
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

      {/* MODAL INTERACTIVO DE BÚSQUEDA POR VOZ */}
      {modalVozAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-slate-900 text-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="p-5 pb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    <Sparkles className="h-3 w-3" />
                    Buscador por Voz
                  </span>
                  <h3 className="mt-0.5 text-base sm:text-lg font-black text-white">
                    ¿Qué quieres pedir hoy en Tirúa?
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  detenerGrabacionVoz();
                  setModalVozAbierto(false);
                }}
                className="rounded-full bg-black/20 p-2 text-white/80 hover:bg-black/40 hover:text-white transition active:scale-95"
                aria-label="Cerrar búsqueda por voz"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido Central */}
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              {/* Botón Central Micrófono con Animación */}
              <div className="relative my-2">
                {escuchando && (
                  <>
                    <span className="animate-ping absolute inset-0 rounded-full bg-rose-500 opacity-40" />
                    <span className="animate-pulse absolute -inset-3 rounded-full bg-amber-500/30" />
                  </>
                )}

                <button
                  type="button"
                  onClick={escuchando ? detenerGrabacionVoz : iniciarGrabacionVoz}
                  className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl transition-transform active:scale-95 ${
                    escuchando
                      ? "bg-rose-600 ring-4 ring-rose-400"
                      : "bg-gradient-to-tr from-amber-500 to-orange-500 hover:scale-105"
                  }`}
                  aria-label={escuchando ? "Detener grabación" : "Iniciar grabación"}
                >
                  {escuchando ? (
                    <Mic className="h-10 w-10 animate-bounce" />
                  ) : (
                    <Mic className="h-10 w-10" />
                  )}
                </button>
              </div>

              {/* Mensaje de Estado */}
              <div>
                <p className="text-sm font-extrabold text-white">
                  {escuchando
                    ? "🔴 Te escuchamos... Di lo que buscas"
                    : "Toca el micrófono para comenzar a hablar"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Puedes decir: <em>"Sushi"</em>, <em>"Locales abiertos"</em>, <em>"Empanadas"</em> o el nombre de tu restaurante favorito.
                </p>
              </div>

              {/* Transcripción en Tiempo Real */}
              <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 min-h-[4.5rem] flex items-center justify-center text-left">
                {transcripcionVoz ? (
                  <p className="text-sm sm:text-base font-bold text-amber-300 italic">
                    "{transcripcionVoz}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Aquí aparecerá lo que digas...
                  </p>
                )}
              </div>

              {/* Error si existe */}
              {errorVoz && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-200 text-left w-full">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorVoz}</span>
                </div>
              )}

              {/* Chips Rápidos de Búsqueda de 1 Toque */}
              <div className="w-full pt-1">
                <span className="block text-[11px] font-bold text-slate-400 mb-2 text-left">
                  O toca una búsqueda rápida recomendada:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "🍣 Sushi",
                    "🟢 Abierto ahora",
                    "🥟 Empanadas",
                    "🍗 Pollos asados",
                    "🍔 Hamburguesas",
                    "🐟 Pescados y mariscos",
                  ].map((chip) => {
                    const textoLimpio = chip.replace(/^[^\w\s]+/, "").trim();
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => aplicarBusquedaVoz(textoLimpio)}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:border-amber-400 hover:bg-amber-500/20 transition active:scale-95"
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Acciones Inferiores */}
            <div className="border-t border-white/10 bg-slate-950/60 p-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  detenerGrabacionVoz();
                  setModalVozAbierto(false);
                }}
                className="flex-1 rounded-2xl border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!transcripcionVoz.trim()}
                onClick={() => aplicarBusquedaVoz(transcripcionVoz)}
                className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-slate-950 shadow-md transition hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Search className="h-4 w-4" />
                <span>Buscar en Tirúa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
