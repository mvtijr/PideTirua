"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Receipt,
  Trophy,
  Medal,
  Crown,
  Sparkles,
  RefreshCw,
  Loader2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Pedido } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface VentasReportesProps {
  localSlug: string;
  localNombre: string;
  accentBg: string;
  accentText: string;
  panelCardBg: string;
  subtitleText: string;
  onNotify?: (msg: string) => void;
}

export default function VentasReportes({
  localSlug,
  localNombre,
  accentBg,
  accentText,
  panelCardBg,
  subtitleText,
  onNotify,
}: VentasReportesProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [recargando, setRecargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(
    new Date()
  );

  const cargarPedidos = useCallback(
    async (silencioso = false) => {
      if (!silencioso) {
        setCargando(true);
      } else {
        setRecargando(true);
      }
      try {
        const res = await fetch(
          `/api/pedidos?local_slug=${encodeURIComponent(localSlug)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.ok && Array.isArray(data.pedidos)) {
          setPedidos(data.pedidos);
          setUltimaActualizacion(new Date());
          setError(null);
        } else {
          setError(data.error || "No se pudieron obtener los pedidos");
        }
      } catch (err) {
        console.error("Error al cargar pedidos para reportes:", err);
        setError("Error de conexión al cargar ventas");
      } finally {
        setCargando(false);
        setRecargando(false);
      }
    },
    [localSlug]
  );

  // Carga inicial y suscripción a Supabase Realtime
  useEffect(() => {
    void cargarPedidos();

    const channel = supabase
      .channel(`reportes-pedidos-${localSlug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `local_slug=eq.${localSlug}`,
        },
        () => {
          void cargarPedidos(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [localSlug, cargarPedidos]);

  // Cálculos de métricas del mes actual
  const now = new Date();
  const mesActual = now.getMonth();
  const anioActual = now.getFullYear();

  const nombreMes = useMemo(() => {
    try {
      const nom = now.toLocaleDateString("es-CL", { month: "long" });
      return nom.charAt(0).toUpperCase() + nom.slice(1);
    } catch {
      return "Mes Actual";
    }
  }, [now]);

  // Excluir pedidos cancelados y filtrar por el mes corriente
  const pedidosMes = useMemo(() => {
    return pedidos.filter((p) => {
      if (p.estado === "cancelado") return false;
      try {
        const fecha = new Date(p.created_at);
        return (
          fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual
        );
      } catch {
        return false;
      }
    });
  }, [pedidos, mesActual, anioActual]);

  // A) Tarjetas Resumen del Mes Actual
  const ventasDelMes = useMemo(() => {
    return pedidosMes.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  }, [pedidosMes]);

  const totalPedidos = pedidosMes.length;

  const ticketPromedio = useMemo(() => {
    if (totalPedidos === 0) return 0;
    return Math.round(ventasDelMes / totalPedidos);
  }, [ventasDelMes, totalPedidos]);

  // B) Ranking "Top 3 Platos Más Vendidos"
  const rankingTop3 = useMemo(() => {
    const mapaConteo: Record<string, number> = {};
    pedidosMes.forEach((p) => {
      (p.items || []).forEach((item) => {
        const nombre = item.nombre?.trim() || "Plato";
        const cantidad = Number(item.cantidad) || 1;
        mapaConteo[nombre] = (mapaConteo[nombre] || 0) + cantidad;
      });
    });

    return Object.entries(mapaConteo)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);
  }, [pedidosMes]);

  const totalPlatosVendidos = useMemo(() => {
    return pedidosMes.reduce((acc, p) => {
      const itemsSuma = (p.items || []).reduce(
        (sub, it) => sub + (Number(it.cantidad) || 1),
        0
      );
      return acc + itemsSuma;
    }, 0);
  }, [pedidosMes]);

  const handleRefrescar = async () => {
    await cargarPedidos(true);
    onNotify?.("Reporte de ventas actualizado");
  };

  return (
    <section
      id="seccion-reportes-ventas"
      className={`rounded-3xl border p-5 shadow-xl sm:p-6 ${panelCardBg}`}
    >
      {/* Encabezado del Reporte */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${accentText}`}
          >
            <BarChart3 className="h-4 w-4" />
            Métricas Comerciales en Tiempo Real
          </span>
          <h2 className="mt-0.5 text-lg font-black text-white sm:text-xl flex items-center gap-2">
            <span>📊 Mis Ventas y Reportes</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-black text-emerald-300 border border-emerald-400/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              En Vivo
            </span>
          </h2>
          <p className={`mt-0.5 text-xs font-medium ${subtitleText}`}>
            Resumen de órdenes digitales de <strong>{localNombre}</strong> para{" "}
            <span className="font-bold text-white">
              {nombreMes} {anioActual}
            </span>{" "}
            (excluye cancelados).
          </p>
        </div>

        <button
          type="button"
          disabled={cargando || recargando}
          onClick={() => void handleRefrescar()}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          title="Actualizar métricas"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              recargando || cargando ? "animate-spin text-emerald-400" : ""
            }`}
          />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {cargando ? (
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center text-white/70">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="mt-2 text-xs font-bold">Cargando reporte de ventas...</p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* A) Tarjetas Resumen del Mes Actual */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* 💰 Ventas del Mes */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/60 via-slate-900/80 to-slate-950/90 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Ventas del Mes
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {formatCLP(ventasDelMes)}
                </p>
                <span className="mt-0.5 block text-[11px] font-medium text-emerald-200/80">
                  {nombreMes} {anioActual} · CLP
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>100% de recaudación directa</span>
              </div>
            </div>

            {/* 📦 Total de Pedidos */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-950/50 via-slate-900/80 to-slate-950/90 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                  Total de Pedidos
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {totalPedidos}
                </p>
                <span className="mt-0.5 block text-[11px] font-medium text-amber-200/80">
                  {totalPedidos === 1
                    ? "1 orden recibida"
                    : `${totalPedidos} órdenes registradas`}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-300">
                <Sparkles className="h-3 w-3" />
                <span>
                  {totalPlatosVendidos}{" "}
                  {totalPlatosVendidos === 1
                    ? "plato preparado"
                    : "platos preparados"}
                </span>
              </div>
            </div>

            {/* 🏷️ Ticket Promedio */}
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/35 bg-gradient-to-br from-sky-950/50 via-slate-900/80 to-slate-950/90 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-300">
                  Ticket Promedio
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {formatCLP(ticketPromedio)}
                </p>
                <span className="mt-0.5 block text-[11px] font-medium text-sky-200/80">
                  Venta media por pedido
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-sky-300">
                <Calendar className="h-3 w-3" />
                <span>Consumo promedio en el local</span>
              </div>
            </div>
          </div>

          {/* B) Ranking "Top 3 Platos Más Vendidos" con Podio Visual */}
          <div className="rounded-2xl border border-white/15 bg-slate-950/50 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white sm:text-base">
                    🏆 Top 3 Platos Más Vendidos
                  </h3>
                  <span className={`text-[11px] font-medium ${subtitleText}`}>
                    Basado en las comandas digitales del mes en curso
                  </span>
                </div>
              </div>

              {rankingTop3.length > 0 && (
                <span className="text-xs font-bold text-amber-300">
                  {rankingTop3.length} favoritos
                </span>
              )}
            </div>

            {rankingTop3.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 py-8 text-center text-white/70">
                <Trophy className="mx-auto h-8 w-8 text-white/30" />
                <p className="mt-2 text-xs font-bold text-white">
                  Aún no hay platos pedidos este mes
                </p>
                <p className={`mt-0.5 text-[11px] ${subtitleText}`}>
                  Cuando tus clientes pidan desde la carta digital, verás aquí el
                  podio de los platos estrella.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {rankingTop3.map((item, idx) => {
                  const lugar = idx + 1;
                  const esOro = lugar === 1;
                  const esPlata = lugar === 2;
                  const esBronce = lugar === 3;

                  const badgeColor = esOro
                    ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                    : esPlata
                    ? "border-slate-300/50 bg-slate-400/20 text-slate-200"
                    : "border-orange-500/50 bg-orange-600/20 text-orange-300";

                  const cardBorder = esOro
                    ? "border-amber-400/40 bg-gradient-to-b from-amber-950/40 via-slate-900/60 to-slate-950/80 shadow-md shadow-amber-500/10"
                    : esPlata
                    ? "border-slate-400/30 bg-gradient-to-b from-slate-800/40 via-slate-900/60 to-slate-950/80"
                    : "border-orange-500/30 bg-gradient-to-b from-orange-950/40 via-slate-900/60 to-slate-950/80";

                  const iconoMedalla = esOro ? (
                    <Crown className="h-4 w-4 text-amber-400" />
                  ) : esPlata ? (
                    <Medal className="h-4 w-4 text-slate-300" />
                  ) : (
                    <Medal className="h-4 w-4 text-orange-400" />
                  );

                  const textoLugar =
                    lugar === 1
                      ? "1° Lugar · Estrella"
                      : lugar === 2
                      ? "2° Lugar · Favorito"
                      : "3° Lugar · Popular";

                  return (
                    <div
                      key={`top-plato-${idx}`}
                      className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition ${cardBorder}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${badgeColor}`}
                          >
                            {iconoMedalla}
                            <span>{textoLugar}</span>
                          </span>

                          <span className="text-[11px] font-extrabold text-white/90">
                            #{lugar}
                          </span>
                        </div>

                        <h4 className="mt-2.5 text-xs font-black text-white sm:text-sm line-clamp-2">
                          {item.nombre}
                        </h4>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-2.5">
                        <span className="text-[11px] font-bold text-white/70">
                          Unidades vendidas:
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-xs font-black text-white">
                          <strong className="text-amber-300">
                            {item.cantidad}
                          </strong>{" "}
                          uds
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* C) Mensaje de Fidelización y ROI (Banner Verde Motivador) */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-4 text-white shadow-xl sm:p-5">
            <div className="relative z-10 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-black text-white uppercase tracking-wider backdrop-blur-xs">
                  <Sparkles className="h-3 w-3" />
                  Impacto Comercial PideTirúa
                </div>
                <h3 className="text-base font-black leading-snug sm:text-lg">
                  🎉 ¡Excelente trabajo! Este mes has generado{" "}
                  <span className="underline decoration-amber-300 decoration-2 underline-offset-2">
                    {formatCLP(ventasDelMes)}
                  </span>{" "}
                  gracias a tus pedidos digitales en PideTirúa.
                </h3>
                <p className="text-xs font-medium text-emerald-100/90 max-w-xl">
                  💡 Tus clientes piden directo a tu WhatsApp sin pagar el 20%
                  al 30% de comisión de otras aplicaciones. En PideTirúa todas tus
                  ventas quedan 100% en tu bolsillo.
                </p>
              </div>

              {ventasDelMes > 0 && (
                <div className="shrink-0 rounded-xl bg-black/25 p-3 text-center backdrop-blur-xs border border-white/15">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-200">
                    Ahorro estimado en comisiones
                  </span>
                  <span className="text-base font-black text-amber-300 sm:text-lg">
                    ~{formatCLP(Math.round(ventasDelMes * 0.22))}
                  </span>
                  <span className="block text-[10px] font-semibold text-emerald-100/80">
                    (Vs. apps con 22% de comisión)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
