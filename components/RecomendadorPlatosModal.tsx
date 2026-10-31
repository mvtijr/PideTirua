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
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";

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

function PlatoSugeridoImagen({
  foto,
  nombre,
}: {
  foto?: string;
  nombre: string;
}) {
  const [error, setError] = useState(false);
  if (!foto || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-400">
        <Store className="h-8 w-8 text-stone-400" />
      </div>
    );
  }
  return (
    <img
      src={foto}
      alt={nombre}
      onError={() => setError(true)}
      className="h-full w-full object-cover transition-transform group-hover:scale-105"
      loading="lazy"
    />
  );
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

  // Bloquear scroll de fondo cuando el modal esté abierto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        reiniciar();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={handleCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recomendador-modal-title"
    >
      <div
        className="relative w-full max-w-xl sm:max-w-2xl my-auto overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FAF8F5] text-[#18181B] shadow-2xl flex flex-col max-h-[92vh] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Editorial con GradientBackground y Textura */}
        <div className="relative p-5 pb-4 sm:p-6 sm:pb-5 border-b border-stone-200/80 bg-white/95 flex items-start justify-between overflow-hidden">
          <GradientBackground
            gradientType="linear-gradient"
            gradientOrigin="left-middle"
            colors={[
              { color: "rgba(255, 247, 237, 0.95)", stop: "0%" },
              { color: "rgba(254, 237, 213, 0.75)", stop: "35%" },
              { color: "rgba(254, 243, 199, 0.6)", stop: "70%" },
              { color: "rgba(255, 255, 255, 0.95)", stop: "100%" },
            ]}
            noiseIntensity={0.6}
            noisePatternAlpha={34}
            noisePatternSize={85}
            noisePatternRefreshInterval={0}
          />

          <div className="relative z-10 flex items-center gap-3.5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#C2410C] border border-orange-200/70 shadow-xs">
              <Dices className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#C2410C] border border-orange-200/60">
                <Sparkles className="h-3 w-3" />
                Asistente Gastronómico
              </span>
              <h2
                id="recomendador-modal-title"
                className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl tracking-wide uppercase text-stone-900 leading-none"
              >
                ¿Indeciso? Te ayudamos en 2 toques
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCerrar}
            className="relative z-10 rounded-full p-2.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition active:scale-95 border border-transparent hover:border-stone-200 shrink-0"
            aria-label="Cerrar recomendador"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Indicador de Pasos / Stepper Artesanal */}
        <div className="flex items-center justify-between border-b border-stone-200/80 bg-[#F4EFE6] px-5 py-3 sm:px-6 sm:py-3.5 text-xs font-bold text-stone-600">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span
              className={`tabular-nums flex h-6 w-6 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-black shadow-xs ${
                paso === 1
                  ? "bg-[#18181B] text-white"
                  : "bg-emerald-600 text-white"
              }`}
            >
              1
            </span>
            <span className={paso === 1 ? "text-stone-900 font-extrabold uppercase tracking-wider text-[11px] sm:text-xs" : "uppercase tracking-wider text-[11px] sm:text-xs"}>
              Comensales
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
            <span
              className={`tabular-nums flex h-6 w-6 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-black shadow-xs ${
                paso === 2
                  ? "bg-[#18181B] text-white"
                  : paso === 3
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-200 text-stone-500"
              }`}
            >
              2
            </span>
            <span className={paso === 2 ? "text-stone-900 font-extrabold uppercase tracking-wider text-[11px] sm:text-xs" : "uppercase tracking-wider text-[11px] sm:text-xs"}>
              Antojo
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
            <span
              className={`tabular-nums flex h-6 w-6 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-black shadow-xs ${
                paso === 3
                  ? "bg-[#18181B] text-white"
                  : "bg-stone-200 text-stone-500"
              }`}
            >
              3
            </span>
            <span className={paso === 3 ? "text-stone-900 font-extrabold uppercase tracking-wider text-[11px] sm:text-xs" : "uppercase tracking-wider text-[11px] sm:text-xs"}>
              Platos
            </span>
          </div>

          {paso > 1 && (
            <button
              type="button"
              onClick={reiniciar}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#C2410C] hover:text-orange-700 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </button>
          )}
        </div>

        {/* Contenido Dinámico según el Paso */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* PASO 1: ¿Con quién comes? */}
          {paso === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="text-center sm:text-left">
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-stone-900">
                  Paso 1: ¿Para cuántas personas es el pedido?
                </h3>
                <p className="font-body text-xs sm:text-sm text-stone-600 mt-1">
                  Selecciona la opción para ajustar el tamaño de las porciones:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                <button
                  type="button"
                  onClick={() => seleccionarConQuien("solo")}
                  className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-stone-200/90 bg-white p-4 sm:p-5 text-center transition hover:border-[#EA580C] hover:bg-orange-50/40 hover:shadow-md active:scale-95 group shadow-xs"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-orange-100 text-[#C2410C] border border-orange-200/60 group-hover:scale-105 transition">
                    <User className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <span className="block font-display text-lg sm:text-xl tracking-wide uppercase text-stone-900 group-hover:text-[#C2410C] transition-colors">
                      Solo yo
                    </span>
                    <span className="block font-body text-xs text-stone-500 mt-0.5">
                      Porción individual
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarConQuien("pareja")}
                  className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-stone-200/90 bg-white p-4 sm:p-5 text-center transition hover:border-[#EA580C] hover:bg-orange-50/40 hover:shadow-md active:scale-95 group shadow-xs"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700 border border-rose-200/60 group-hover:scale-105 transition">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <span className="block font-display text-lg sm:text-xl tracking-wide uppercase text-stone-900 group-hover:text-[#C2410C] transition-colors">
                      En pareja
                    </span>
                    <span className="block font-body text-xs text-stone-500 mt-0.5">
                      Para 2 personas
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarConQuien("grupo")}
                  className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-stone-200/90 bg-white p-4 sm:p-5 text-center transition hover:border-[#EA580C] hover:bg-orange-50/40 hover:shadow-md active:scale-95 group shadow-xs"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-sky-100 text-[#0284C7] border border-sky-200/60 group-hover:scale-105 transition">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <span className="block font-display text-lg sm:text-xl tracking-wide uppercase text-stone-900 group-hover:text-[#C2410C] transition-colors">
                      En grupo
                    </span>
                    <span className="block font-body text-xs text-stone-500 mt-0.5">
                      Familia o amigos
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: ¿Qué antojo tienes? */}
          {paso === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="text-center sm:text-left">
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-stone-900">
                  Paso 2: ¿Qué tipo de antojo tienes hoy?
                </h3>
                <p className="font-body text-xs sm:text-sm text-stone-600 mt-1">
                  Elige el sabor que más te entusiasma:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => seleccionarAntojo("rapido")}
                  className="flex items-center gap-3.5 rounded-2xl border-2 border-stone-200/90 bg-white p-4 text-left transition hover:border-[#EA580C] hover:bg-orange-50/40 hover:shadow-md active:scale-95 group shadow-xs"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#C2410C] border border-orange-200/60 group-hover:scale-105 transition">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block font-display text-lg tracking-wide uppercase text-stone-900 group-hover:text-[#C2410C] transition-colors">
                      Rápido y contundente
                    </span>
                    <span className="block font-body text-xs text-stone-500 leading-snug mt-0.5">
                      Burgers, sándwiches, papas y chorrillanas
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarAntojo("sushi")}
                  className="flex items-center gap-3.5 rounded-2xl border-2 border-stone-200/90 bg-white p-4 text-left transition hover:border-[#EA580C] hover:bg-orange-50/40 hover:shadow-md active:scale-95 group shadow-xs"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 border border-rose-200/60 group-hover:scale-105 transition">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block font-display text-lg tracking-wide uppercase text-stone-900 group-hover:text-[#C2410C] transition-colors">
                      Sushi / Fusión
                    </span>
                    <span className="block font-body text-xs text-stone-500 leading-snug mt-0.5">
                      Rolls tempura, handrolls y combinaciones
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarAntojo("pescados")}
                  className="flex items-center gap-3.5 rounded-2xl border-2 border-stone-200/90 bg-white p-4 text-left transition hover:border-[#EA580C] hover:bg-orange-50/40 hover:shadow-md active:scale-95 group shadow-xs"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#0284C7] border border-sky-200/60 group-hover:scale-105 transition">
                    <Fish className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block font-display text-lg tracking-wide uppercase text-stone-900 group-hover:text-[#C2410C] transition-colors">
                      Pescados / Tradicional
                    </span>
                    <span className="block font-body text-xs text-stone-500 leading-snug mt-0.5">
                      Reineta fresca, mariscos y sazón marina
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => seleccionarAntojo("economico")}
                  className="flex items-center gap-3.5 rounded-2xl border-2 border-stone-200/90 bg-white p-4 text-left transition hover:border-[#EA580C] hover:bg-orange-50/40 hover:shadow-md active:scale-95 group shadow-xs"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200/60 group-hover:scale-105 transition">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block font-display text-lg tracking-wide uppercase text-stone-900 group-hover:text-[#C2410C] transition-colors">
                      Económico
                    </span>
                    <span className="block font-body text-xs text-stone-500 leading-snug mt-0.5">
                      Platos ricos y promociones al mejor precio
                    </span>
                  </div>
                </button>
              </div>

              {/* Búsqueda manual de antojo específico */}
              <div className="pt-4 border-t border-stone-200/80 mt-2">
                <label className="block font-body text-xs sm:text-sm font-bold text-stone-700 mb-1.5">
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
                    className="flex-1 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:ring-2 focus:ring-orange-200 focus:outline-none shadow-xs font-medium"
                  />
                  <button
                    type="submit"
                    className="flex min-h-[44px] items-center justify-center rounded-full bg-[#18181B] hover:bg-[#EA580C] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 shrink-0 shadow-xs"
                  >
                    Buscar plato
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PASO 3: Resultados con las 3 mejores recomendaciones */}
          {paso === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-stone-900">
                    Tus recomendaciones ideales
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-stone-600 mt-0.5">
                    {busquedaTexto ? (
                      <span>Platos que coinciden con: <strong className="text-[#C2410C]">"{busquedaTexto}"</strong></span>
                    ) : antojo === "sushi" ? (
                      <span>Especialidades de <strong className="text-rose-700">Sushi y Rolls</strong></span>
                    ) : antojo === "pescados" ? (
                      <span>Especialidades de <strong className="text-[#0284C7]">Pescados y Mariscos</strong></span>
                    ) : antojo === "rapido" ? (
                      <span>Especialidades de <strong className="text-[#C2410C]">Comida Rápida y Contundente</strong></span>
                    ) : (
                      <span>Platos <strong className="text-emerald-700">Económicos y Promos</strong></span>
                    )}
                    {conQuien && <span> · {conQuien === "solo" ? "👤 Para ti" : conQuien === "pareja" ? "👥 En pareja" : "👨‍👩‍👧‍👦 En grupo"}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reiniciar}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white hover:border-[#EA580C] hover:bg-orange-50/50 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-stone-700 hover:text-[#C2410C] transition shadow-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Probar otro</span>
                </button>
              </div>

              {sugerencias.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
                  <p className="font-body text-sm text-stone-600">No encontramos platos exactos para este filtro en este momento.</p>
                  <button
                    type="button"
                    onClick={reiniciar}
                    className="mt-3 rounded-full bg-[#18181B] hover:bg-[#EA580C] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition shadow-xs"
                  >
                    Probar otras opciones
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
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
                        className="group relative flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs transition hover:border-[#EA580C] hover:shadow-md"
                      >
                        {/* Medalla 1°, 2°, 3° */}
                        <div className="tabular-nums absolute -top-2.5 -left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#EA580C] text-xs font-black text-white shadow-md">
                          #{idx + 1}
                        </div>

                        {/* Foto del plato */}
                        <div className="relative h-28 w-full sm:w-32 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/60">
                          <PlatoSugeridoImagen
                            foto={foto}
                            nombre={item.producto.nombre}
                          />
                          {item.producto.es_oferta && (
                            <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-[#EA580C] px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-xs">
                              <Flame className="h-2.5 w-2.5" />
                              Promo
                            </span>
                          )}
                        </div>

                        {/* Detalles */}
                        <div className="flex-1 min-w-0 text-left w-full sm:w-auto">
                          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#C2410C]">
                            <Store className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{item.localNombre}</span>
                            <span className="text-stone-300">•</span>
                            <span className={item.localAbierto ? "text-emerald-600" : "text-rose-600"}>
                              {item.localAbierto ? "Abierto ahora" : "Cerrado"}
                            </span>
                          </div>

                          <h4 className="mt-1 font-display text-xl tracking-wide uppercase text-stone-900 group-hover:text-[#C2410C] transition-colors truncate">
                            {item.producto.nombre}
                          </h4>

                          {item.producto.descripcion && (
                            <p className="mt-0.5 font-body text-xs text-stone-500 line-clamp-2 leading-relaxed">
                              {item.producto.descripcion}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-2.5">
                            <span className="tabular-nums text-lg font-black text-[#C2410C]">
                              {formatCLP(precioFinal)}
                            </span>

                            <Link
                              href={`/${item.localSlug}`}
                              onClick={handleCerrar}
                              className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#18181B] hover:bg-[#EA580C] px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-xs transition-all active:scale-95 shrink-0"
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
        <div className="border-t border-stone-200/80 bg-[#FAF8F5] p-3.5 text-center">
          <p className="font-body text-[11px] font-bold text-stone-600 flex items-center justify-center gap-1.5">
            <span className="text-[#C2410C]">⚡</span> Los pedidos se envían directamente al WhatsApp del restaurante en Tirúa
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
