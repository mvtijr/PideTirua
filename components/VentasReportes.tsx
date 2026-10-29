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
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Pedido } from "@/types/local";
import { formatCLP } from "@/lib/formatters";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";

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
      className={`relative overflow-hidden rounded-3xl border p-5 shadow-xl sm:p-6 ${panelCardBg}`}
    >
      {/* Fondo con degradado y textura de ruido estática (Zero GPU loop) */}
      <GradientBackground
        gradientType="radial-gradient"
        gradientOrigin="top-left"
        gradientSize="140% 120%"
        colors={[
          { color: "rgba(255, 247, 237, 0.7)", stop: "0%" },
          { color: "rgba(254, 243, 199, 0.4)", stop: "35%" },
          { color: "rgba(255, 255, 255, 0.95)", stop: "70%" },
          { color: "rgba(255, 255, 255, 1)", stop: "100%" },
        ]}
        noiseIntensity={0.5}
        noisePatternAlpha={26}
        noisePatternSize={80}
        noisePatternRefreshInterval={0}
      />

      <div className="relative z-10">
      {/* Encabezado del Reporte */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${accentText}`}
          >
            <BarChart3 className="h-4 w-4" />
            Métricas Comerciales en Tiempo Real
          </span>
          <h2 className="mt-0.5 text-lg font-display uppercase tracking-wide text-stone-900 sm:text-xl flex items-center gap-2">
            <span>📊 Mis Ventas y Reportes</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En Vivo
            </span>
          </h2>
          <p className={`mt-0.5 text-xs font-medium ${subtitleText}`}>
            Resumen de órdenes digitales de <strong>{localNombre}</strong> para{" "}
            <span className="font-bold text-stone-900">
              {nombreMes} {anioActual}
            </span>{" "}
            (excluye cancelados).
          </p>
        </div>

        <button
          type="button"
          disabled={cargando || recargando}
          onClick={() => void handleRefrescar()}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 shadow-xs transition hover:bg-stone-100 active:scale-95 disabled:opacity-50"
          title="Actualizar métricas"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              recargando || cargando ? "animate-spin text-[#C2410C]" : ""
            }`}
          />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {cargando ? (
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center text-stone-500">
          <Loader2 className="h-8 w-8 animate-spin text-[#C2410C]" />
          <p className="mt-2 text-xs font-bold">Cargando reporte de ventas...</p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* A) Cifras de Cuadre del Mes Actual (Estructura Semántica DL/DT/DD Accesible) */}
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* 💰 Ventas del Mes */}
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Ventas del Mes
                </dt>
                <div
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
                >
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <dd className="mt-2 m-0">
                <p className="tabular-nums text-2xl font-display uppercase tracking-wide text-stone-900 sm:text-3xl">
                  {formatCLP(ventasDelMes)}
                </p>
                <span className="mt-0.5 block text-[11px] font-medium text-stone-500">
                  {nombreMes} {anioActual} · CLP
                </span>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  <span>100% de recaudación directa</span>
                </div>
              </dd>
            </div>

            {/* 📦 Total de Pedidos */}
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Total de Pedidos
                </dt>
                <div
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
                >
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <dd className="mt-2 m-0">
                <p className="tabular-nums text-2xl font-display uppercase tracking-wide text-stone-900 sm:text-3xl">
                  {totalPedidos}
                </p>
                <span className="mt-0.5 block text-[11px] font-medium text-stone-500">
                  {totalPedidos === 1
                    ? "1 orden recibida"
                    : `${totalPedidos} órdenes registradas`}
                </span>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-700">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  <span className="tabular-nums">
                    {totalPlatosVendidos}{" "}
                    {totalPlatosVendidos === 1
                      ? "plato preparado"
                      : "platos preparados"}
                  </span>
                </div>
              </dd>
            </div>

            {/* 🏷️ Ticket Promedio */}
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                  Ticket Promedio
                </dt>
                <div
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700"
                >
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <dd className="mt-2 m-0">
                <p className="tabular-nums text-2xl font-display uppercase tracking-wide text-stone-900 sm:text-3xl">
                  {formatCLP(ticketPromedio)}
                </p>
                <span className="mt-0.5 block text-[11px] font-medium text-stone-500">
                  Venta media por pedido
                </span>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-sky-700">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  <span>Consumo promedio en el local</span>
                </div>
              </dd>
            </div>
          </dl>

          {/* B) Ranking "Top 3 Platos Más Vendidos" con Semántica Accesible (OL y Table) */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800" aria-hidden="true">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-display uppercase tracking-wide text-stone-900">
                    🏆 Top 3 Platos Más Vendidos
                  </h3>
                  <span className={`text-[11px] font-medium ${subtitleText}`}>
                    Basado en las comandas digitales del mes en curso
                  </span>
                </div>
              </div>

              {rankingTop3.length > 0 && (
                <span className="text-xs font-bold text-amber-800">
                  {rankingTop3.length} favoritos
                </span>
              )}
            </div>

            {rankingTop3.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white py-8 text-center text-stone-500">
                <Trophy className="mx-auto h-8 w-8 text-stone-300" aria-hidden="true" />
                <p className="mt-2 text-xs font-bold text-stone-700">
                  Aún no hay platos pedidos este mes
                </p>
                <p className={`mt-0.5 text-[11px] ${subtitleText}`}>
                  Cuando tus clientes pidan desde la carta digital, verás aquí el
                  podio de los platos estrella.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Podio Visual con Semántica de Lista Ordenada <ol> / <li> */}
                <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 list-none p-0 m-0">
                  {rankingTop3.map((item, idx) => {
                    const lugar = idx + 1;
                    const esOro = lugar === 1;
                    const esPlata = lugar === 2;

                    const badgeColor = esOro
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : esPlata
                      ? "border-stone-300 bg-stone-100 text-stone-700"
                      : "border-orange-300 bg-orange-50 text-orange-800";

                    const cardBorder = esOro
                      ? "border-amber-300 bg-white shadow-xs"
                      : esPlata
                      ? "border-stone-200 bg-white shadow-xs"
                      : "border-orange-200 bg-white shadow-xs";

                    const iconoMedalla = esOro ? (
                      <Crown className="h-4 w-4 text-amber-600" aria-hidden="true" />
                    ) : esPlata ? (
                      <Medal className="h-4 w-4 text-stone-500" aria-hidden="true" />
                    ) : (
                      <Medal className="h-4 w-4 text-orange-600" aria-hidden="true" />
                    );

                    const textoLugar =
                      lugar === 1
                        ? "1° Lugar · Estrella"
                        : lugar === 2
                        ? "2° Lugar · Favorito"
                        : "3° Lugar · Popular";

                    return (
                      <li
                        key={`top-plato-${idx}`}
                        className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition ${cardBorder}`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${badgeColor}`}
                            >
                              {iconoMedalla}
                              <span>{textoLugar}</span>
                            </span>

                            <span className="tabular-nums text-[11px] font-black text-stone-600">
                              #{lugar}
                            </span>
                          </div>

                          <h4 className="mt-2.5 text-xs font-bold text-stone-900 sm:text-sm line-clamp-2">
                            {item.nombre}
                          </h4>
                        </div>

                        <div className="mt-3.5 flex items-center justify-between border-t border-stone-100 pt-2.5">
                          <span className="text-[11px] font-bold text-stone-500">
                            Unidades vendidas:
                          </span>
                          <span className="tabular-nums inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-0.5 text-xs font-black text-stone-900">
                            <strong className="text-[#C2410C]">
                              {item.cantidad}
                            </strong>{" "}
                            uds
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {/* Tabla Semántica Accesible de Cuadre y Demanda */}
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/80 px-3.5 py-2.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-700">
                      <FileText className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
                      Cuadro Detallado de Ranking y Cuadre
                    </span>
                    <span className="text-[11px] font-medium text-stone-500">
                      Total unidades: <strong className="text-stone-800">{totalPlatosVendidos}</strong>
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <caption className="sr-only">
                        Cuadro estadístico de ventas por plato del mes actual
                      </caption>
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50/40 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                          <th scope="col" className="py-2.5 pl-3.5 pr-2">
                            Posición
                          </th>
                          <th scope="col" className="py-2.5 px-3">
                            Plato
                          </th>
                          <th scope="col" className="py-2.5 px-3 text-right">
                            Unidades Vendidas
                          </th>
                          <th scope="col" className="py-2.5 pr-3.5 pl-2 text-right">
                            Participación
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {rankingTop3.map((item, idx) => {
                          const porcentaje =
                            totalPlatosVendidos > 0
                              ? Math.round(
                                  (item.cantidad / totalPlatosVendidos) * 100
                                )
                              : 0;
                          return (
                            <tr
                              key={`ranking-row-${idx}`}
                              className="hover:bg-stone-50/60 transition"
                            >
                              <td className="py-2.5 pl-3.5 pr-2 font-bold tabular-nums text-stone-800">
                                #{idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-stone-900">
                                {item.nombre}
                              </td>
                              <td className="py-2.5 px-3 text-right font-black tabular-nums text-[#C2410C]">
                                {item.cantidad} uds
                              </td>
                              <td className="py-2.5 pr-3.5 pl-2 text-right tabular-nums font-medium text-stone-600">
                                {porcentaje}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
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
                  <span className="block text-[11px] font-black uppercase tracking-wider text-emerald-200">
                    Ahorro estimado en comisiones
                  </span>
                  <span className="text-base font-black text-amber-300 sm:text-lg">
                    ~{formatCLP(Math.round(ventasDelMes * 0.22))}
                  </span>
                  <span className="block text-[11px] font-semibold text-emerald-100/90">
                    (Vs. apps con 22% de comisión)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
