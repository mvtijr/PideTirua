"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Dices,
  X,
  User,
  Users,
  Sparkles,
  Zap,
  Fish,
  Coins,
  ArrowRight,
  RotateCcw,
  Store,
  ChevronRight,
  Flame,
} from "lucide-react";
import { Local, Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface RecomendadorPlatosModalProps {
  isOpen: boolean;
  onClose: () => void;
  locales: Local[];
}

type ConQuien = "solo" | "pareja" | "grupo";
type Antojo = "rapido" | "sushi" | "pescados" | "economico";

interface PlatoSugerido {
  localSlug: string;
  localNombre: string;
  localLogo: string;
  localAbierto: boolean;
  producto: Producto;
  score: number;
}

export default function RecomendadorPlatosModal({
  isOpen,
  onClose,
  locales,
}: RecomendadorPlatosModalProps) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [conQuien, setConQuien] = useState<ConQuien | null>(null);
  const [antojo, setAntojo] = useState<Antojo | null>(null);

  const [busquedaTexto, setBusquedaTexto] = useState("");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  const reiniciar = () => {
    setPaso(1);
    setConQuien(null);
    setAntojo(null);
    setBusquedaTexto("");
  };

  const handleCerrar = () => {
    reiniciar();
    onClose();
  };

  const seleccionarConQuien = (opcion: ConQuien) => {
    setConQuien(opcion);
    setPaso(2);
  };

  const seleccionarAntojo = (opcion: Antojo) => {
    setAntojo(opcion);
    setBusquedaTexto("");
    setPaso(3);
  };

  const seleccionarBusquedaManual = (texto: string) => {
    if (!texto.trim()) return;
    setBusquedaTexto(texto.trim());
    setAntojo(null);
    setPaso(3);
  };

  // Algoritmo de filtrado estricto y recomendación gastronómica personalizada
  const sugerencias = useMemo<PlatoSugerido[]>(() => {
    if (!conQuien || (!antojo && !busquedaTexto.trim())) return [];

    const todosLosPlatos: Array<{
      localSlug: string;
      localNombre: string;
      localRubro: string;
      categoriaNombre: string;
      localLogo: string;
      localAbierto: boolean;
      producto: Producto;
    }> = [];

    // Tomar todos los platos disponibles de locales activos
    const localesCandidatos = locales.filter((loc) => loc.activo !== false);

    for (const loc of localesCandidatos) {
      for (const cat of loc.categorias) {
        for (const prod of cat.productos) {
          if (prod.disponible !== false) {
            todosLosPlatos.push({
              localSlug: loc.slug,
              localNombre: loc.nombre,
              localRubro: loc.rubro || "",
              categoriaNombre: cat.nombre || "",
              localLogo: loc.logo || loc.logo_url || "",
              localAbierto: loc.abierto,
              producto: prod,
            });
          }
        }
      }
    }

    if (todosLosPlatos.length === 0) return [];

    // 1. FILTRADO ESTRICTO: solo platos que coinciden con el antojo o término solicitado
    const candidatosFiltrados = todosLosPlatos.filter((item) => {
      const texto = `${item.producto.nombre} ${item.producto.descripcion} ${item.producto.etiqueta || ""}`.toLowerCase();
      const cat = item.categoriaNombre.toLowerCase();
      const rubro = item.localRubro.toLowerCase();
      const precio =
        item.producto.es_oferta &&
        typeof item.producto.precio_oferta === "number" &&
        item.producto.precio_oferta > 0
          ? item.producto.precio_oferta
          : item.producto.precio;

      // Si el cliente ingresó texto manual en el buscador del recomendador
      if (busquedaTexto.trim()) {
        const q = busquedaTexto.trim().toLowerCase();
        return texto.includes(q) || cat.includes(q) || rubro.includes(q) || item.localNombre.toLowerCase().includes(q);
      }

      // Si seleccionó Sushi: SOLO sushi, rolls, tempuras, handrolls (nunca carnes o pescados comunes)
      if (antojo === "sushi") {
        const sushiWords = ["sushi", "roll", "rolls", "handroll", "furay", "tempura", "sashimi", "gyoza", "hosomaki", "nikkei", "unagi"];
        const esSushi = sushiWords.some((w) => texto.includes(w) || cat.includes(w) || rubro.includes(w));
        const esCarneOBurger = texto.includes("smash") || texto.includes("churrasco") || texto.includes("pollo asado");
        return esSushi && !esCarneOBurger;
      }

      // Si seleccionó Pescados/Mariscos: SOLO productos del mar (reineta, mariscos, salmón, paila, caldillo, etc.)
      if (antojo === "pescados") {
        const marWords = [
          "pescado", "marisco", "reineta", "merluza", "salmon", "salmón",
          "paila", "chupe", "caldillo", "jaiba", "camaron", "camarón",
          "macha", "machas", "ceviche", "congrio", "navajuela", "almeja",
          "chorito", "piure", "empanada camar", "empanada macha", "empanada pino de mariscos"
        ];
        return marWords.some((w) => texto.includes(w) || cat.includes(w) || rubro.includes(w));
      }

      // Si seleccionó Rápido y contundente: Burgers, sándwiches, completos, chorrillanas, pollos
      if (antojo === "rapido") {
        const rapidoWords = [
          "burger", "hamburguesa", "smash", "churrasco", "sandwich", "sándwich",
          "chacarero", "completo", "italiano", "chorrillana", "papas fritas",
          "papas", "pollo asado", "pollo entero", "medio pollo", "cuarto de pollo", "pizza"
        ];
        return rapidoWords.some((w) => texto.includes(w) || cat.includes(w));
      }

      // Si seleccionó Económico: Platos bajo $7.500 CLP o con oferta activa
      if (antojo === "economico") {
        return precio <= 7500 || Boolean(item.producto.es_oferta);
      }

      return true;
    });

    if (candidatosFiltrados.length === 0) return [];

    // 2. PUNTUACIÓN según el grupo de comensales y valor agregado
    const puntuados = candidatosFiltrados.map((item) => {
      const texto = `${item.producto.nombre} ${item.producto.descripcion} ${item.producto.etiqueta || ""}`.toLowerCase();
      const precio =
        item.producto.es_oferta &&
        typeof item.producto.precio_oferta === "number" &&
        item.producto.precio_oferta > 0
          ? item.producto.precio_oferta
          : item.producto.precio;

      let score = 10; // Base para todo plato que ya aprobó el filtro estricto

      // Ponderación por comensales
      if (conQuien === "solo") {
        if (precio <= 8500) score += 12;
        if (texto.includes("individual") || texto.includes("colacion") || texto.includes("promo 1") || texto.includes("cuarto de pollo")) score += 10;
        if (texto.includes("familiar") || texto.includes("para compartir") || texto.includes("para 3")) score -= 25;
      } else if (conQuien === "pareja") {
        if (precio >= 7000 && precio <= 20000) score += 10;
        if (
          texto.includes("pareja") ||
          texto.includes("para 2") ||
          texto.includes("2 personas") ||
          texto.includes("medio pollo") ||
          texto.includes("2 completos") ||
          texto.includes("30") ||
          texto.includes("once costera")
        ) {
          score += 15;
        }
      } else if (conQuien === "grupo") {
        if (
          texto.includes("familiar") ||
          texto.includes("para compartir") ||
          texto.includes("para 3") ||
          texto.includes("pollo entero") ||
          texto.includes("chorrillana") ||
          texto.includes("tabla") ||
          texto.includes("40") ||
          texto.includes("60")
        ) {
          score += 20;
        }
        if (precio >= 13000) score += 10;
        if (precio < 4000) score -= 15; // Excluir colaciones o porciones individuales mínimas
      }

      // Priorizar locales abiertos y platos destacados
      if (item.localAbierto) score += 8;
      if (item.producto.destacado) score += 5;
      if (item.producto.es_oferta) score += 6;
      if (item.producto.imagen_url || item.producto.imagen) score += 4;

      return {
        localSlug: item.localSlug,
        localNombre: item.localNombre,
        localLogo: item.localLogo,
        localAbierto: item.localAbierto,
        producto: item.producto,
        score,
      };
    });

    // Ordenar de mayor a menor puntuación
    puntuados.sort((a, b) => b.score - a.score);

    // Selección inteligente: procurar variedad si existen varios locales que venden el antojo,
    // pero si solo 1 local vende ese antojo (ej: Sushi Burger para sushi), tomar sus mejores platos.
    const seleccionados: PlatoSugerido[] = [];
    const localesUsados = new Set<string>();

    for (const candidato of puntuados) {
      if (!localesUsados.has(candidato.localSlug)) {
        seleccionados.push(candidato);
        localesUsados.add(candidato.localSlug);
      }
      if (seleccionados.length === 3) break;
    }

    // Rellenar hasta 3 con los mejores candidatos filtrados que faltan
    if (seleccionados.length < 3) {
      for (const candidato of puntuados) {
        if (!seleccionados.some((s) => s.producto.id === candidato.producto.id)) {
          seleccionados.push(candidato);
        }
        if (seleccionados.length === 3) break;
      }
    }

    return seleccionados;
  }, [conQuien, antojo, busquedaTexto, locales]);

  if (!isOpen || !montado || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={handleCerrar}
    >
      <div
        className="relative w-full max-w-lg my-auto overflow-hidden rounded-3xl border border-white/20 bg-slate-900 text-white shadow-2xl flex flex-col max-h-[92vh] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera con gradiente y botón cerrar */}
        <div className="relative p-5 pb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-amber-100">
              <Dices className="h-7 w-7 animate-spin-slow" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                <Sparkles className="h-3 w-3" />
                Asistente Gastronómico
              </span>
              <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">
                🎲 ¿Indeciso? Te ayudamos en 2 toques
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCerrar}
            className="rounded-full bg-black/20 p-2 text-white/80 hover:bg-black/40 hover:text-white transition active:scale-95"
            aria-label="Cerrar recomendador"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Indicador de Pasos */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/50 px-5 py-2.5 text-xs font-bold text-white/70">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                paso === 1
                  ? "bg-amber-500 text-slate-950"
                  : "bg-emerald-500 text-white"
              }`}
            >
              1
            </span>
            <span className={paso === 1 ? "text-white font-extrabold" : ""}>
              Comensales
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                paso === 2
                  ? "bg-amber-500 text-slate-950"
                  : paso === 3
                  ? "bg-emerald-500 text-white"
                  : "bg-white/10 text-white/40"
              }`}
            >
              2
            </span>
            <span className={paso === 2 ? "text-white font-extrabold" : ""}>
              Antojo
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                paso === 3
                  ? "bg-amber-500 text-slate-950"
                  : "bg-white/10 text-white/40"
              }`}
            >
              3
            </span>
            <span className={paso === 3 ? "text-white font-extrabold" : ""}>
              Platos
            </span>
          </div>

          {paso > 1 && (
            <button
              type="button"
              onClick={reiniciar}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-400 hover:text-amber-300 transition"
            >
              <RotateCcw className="h-3 w-3" />
              Reiniciar
            </button>
          )}
        </div>

        {/* Contenido Dinámico según el Paso */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* PASO 1: ¿Con quién comes? */}
          {paso === 1 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="text-center sm:text-left">
                <h3 className="text-base font-extrabold text-white">
                  Paso 1: ¿Para cuántas personas es el pedido?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona la opción para ajustar el tamaño de las porciones:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-2">
                <button
                  type="button"
                  onClick={() => seleccionarConQuien("solo")}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-white/15 bg-white/5 p-4 text-center transition hover:border-amber-400 hover:bg-amber-500/15 active:scale-95 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-white">
                      👤 Solo yo
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Porción individual
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarConQuien("pareja")}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-white/15 bg-white/5 p-4 text-center transition hover:border-amber-400 hover:bg-amber-500/15 active:scale-95 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 group-hover:scale-110 transition">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-white">
                      👥 En pareja
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Para 2 personas
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarConQuien("grupo")}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-white/15 bg-white/5 p-4 text-center transition hover:border-amber-400 hover:bg-amber-500/15 active:scale-95 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 group-hover:scale-110 transition">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-white">
                      👨‍👩‍👧‍👦 En grupo
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Familia o amigos
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: ¿Qué antojo tienes? */}
          {paso === 2 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="text-center sm:text-left">
                <h3 className="text-base font-extrabold text-white">
                  Paso 2: ¿Qué tipo de antojo tienes hoy?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Elige el sabor que más te entusiasma:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => seleccionarAntojo("rapido")}
                  className="flex items-center gap-3 rounded-2xl border-2 border-white/15 bg-white/5 p-3.5 text-left transition hover:border-orange-400 hover:bg-orange-500/15 active:scale-95 group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 group-hover:scale-110 transition">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-white sm:text-sm">
                      ⚡ Rápido y contundente
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Burgers, sándwiches, papas y chorrillanas
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarAntojo("sushi")}
                  className="flex items-center gap-3 rounded-2xl border-2 border-white/15 bg-white/5 p-3.5 text-left transition hover:border-rose-400 hover:bg-rose-500/15 active:scale-95 group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-110 transition">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-white sm:text-sm">
                      🍣 Sushi / Fusión
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Rolls tempura, handrolls y combinaciones
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarAntojo("pescados")}
                  className="flex items-center gap-3 rounded-2xl border-2 border-white/15 bg-white/5 p-3.5 text-left transition hover:border-sky-400 hover:bg-sky-500/15 active:scale-95 group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 group-hover:scale-110 transition">
                    <Fish className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-white sm:text-sm">
                      🐟 Pescados / Tradicional
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Reineta fresca, mariscos y sazón marina
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarAntojo("economico")}
                  className="flex items-center gap-3 rounded-2xl border-2 border-white/15 bg-white/5 p-3.5 text-left transition hover:border-emerald-400 hover:bg-emerald-500/15 active:scale-95 group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-white sm:text-sm">
                      💰 Económico
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Platos ricos y promociones al mejor precio
                    </span>
                  </div>
                </button>
              </div>

              {/* Búsqueda manual de antojo específico */}
              <div className="pt-3 border-t border-white/10 mt-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ¿O tienes un antojo o plato específico en mente?
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = (form.elements.namedItem("antojoManual") as HTMLInputElement)?.value;
                    if (input?.trim()) {
                      seleccionarBusquedaManual(input.trim());
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    name="antojoManual"
                    type="text"
                    placeholder="Ej: Empanadas, cazuela, churrasco, handroll, mariscos..."
                    className="flex-1 rounded-xl border border-white/20 bg-black/40 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2.5 text-xs font-black text-slate-950 transition hover:from-amber-400 hover:to-orange-400 active:scale-95 shrink-0"
                  >
                    Buscar plato
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PASO 3: Resultados con las 3 mejores recomendaciones */}
          {paso === 3 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    🎯 Tus recomendaciones ideales
                  </h3>
                  <p className="text-xs text-slate-400">
                    {busquedaTexto ? (
                      <span>Platos que coinciden con: <strong className="text-amber-300">"{busquedaTexto}"</strong></span>
                    ) : antojo === "sushi" ? (
                      <span>Especialidades de <strong className="text-rose-300">🍣 Sushi y Rolls</strong></span>
                    ) : antojo === "pescados" ? (
                      <span>Especialidades de <strong className="text-sky-300">🐟 Pescados y Mariscos</strong></span>
                    ) : antojo === "rapido" ? (
                      <span>Especialidades de <strong className="text-orange-300">⚡ Comida Rápida y Contundente</strong></span>
                    ) : (
                      <span>Platos <strong className="text-emerald-300">💰 Económicos y Promos</strong></span>
                    )}
                    {conQuien && <span> · {conQuien === "solo" ? "👤 Para ti" : conQuien === "pareja" ? "👥 En pareja" : "👨‍👩‍👧‍👦 En grupo"}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reiniciar}
                  className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Probar otro</span>
                </button>
              </div>

              {sugerencias.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-400">
                  <p className="text-sm">No encontramos platos exactos para este filtro en este momento.</p>
                  <button
                    type="button"
                    onClick={reiniciar}
                    className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950"
                  >
                    Probar otras opciones
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sugerencias.map((item, idx) => {
                    const foto = item.producto.imagen_url || item.producto.imagen;
                    const precioFinal =
                      item.producto.es_oferta &&
                      typeof item.producto.precio_oferta === "number" &&
                      item.producto.precio_oferta > 0
                        ? item.producto.precio_oferta
                        : item.producto.precio;

                    return (
                      <div
                        key={item.producto.id}
                        className="group relative flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3.5 transition hover:border-amber-400/60 hover:bg-white/10"
                      >
                        {/* Medalla 1°, 2°, 3° */}
                        <div className="absolute -top-2.5 -left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-black text-slate-950 shadow-md">
                          #{idx + 1}
                        </div>

                        {/* Foto del plato */}
                        <div className="relative h-24 w-full sm:w-24 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                          {foto ? (
                            <img
                              src={foto}
                              alt={item.producto.nombre}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-600">
                              <Store className="h-8 w-8" />
                            </div>
                          )}
                          {item.producto.es_oferta && (
                            <span className="absolute top-1 right-1 flex items-center gap-0.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                              <Flame className="h-2.5 w-2.5" />
                              Promo
                            </span>
                          )}
                        </div>

                        {/* Detalles */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                            <Store className="h-3 w-3" />
                            <span className="truncate">{item.localNombre}</span>
                            <span className="text-white/40">•</span>
                            <span className={item.localAbierto ? "text-emerald-400" : "text-rose-400"}>
                              {item.localAbierto ? "Abierto" : "Cerrado"}
                            </span>
                          </div>

                          <h4 className="mt-0.5 text-sm font-extrabold text-white truncate">
                            {item.producto.nombre}
                          </h4>

                          {item.producto.descripcion && (
                            <p className="mt-0.5 text-xs text-slate-300 line-clamp-1">
                              {item.producto.descripcion}
                            </p>
                          )}

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-base font-black text-emerald-400">
                              {formatCLP(precioFinal)}
                            </span>

                            <Link
                              href={`/${item.localSlug}`}
                              onClick={handleCerrar}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-md transition hover:from-amber-400 hover:to-orange-400 active:scale-95"
                            >
                              <span>Pedir este plato</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="border-t border-white/10 bg-slate-950/60 p-3.5 text-center">
          <p className="text-[11px] font-medium text-slate-400">
            ⚡ Los pedidos se envían directamente al WhatsApp del restaurante en Tirúa
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
