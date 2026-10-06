"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  ChefHat,
  Clock,
  CreditCard,
  Banknote,
  MapPin,
  FileText,
  Volume2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Utensils,
  Store,
  PackageCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EstadoPedido, Pedido } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface KitchenMonitorProps {
  localSlug: string;
  localNombre: string;
  accentBg: string;
  accentText: string;
  panelCardBg: string;
  subtitleText: string;
  onNotify?: (msg: string) => void;
}

/**
 * Reproduce un timbre agradable estilo "Ding-Dong" de 2 tonos usando Web Audio API
 * sin requerir archivos MP3/WAV externos.
 */
export function playKitchenDingDongChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      gainPeak: number
    ) => {
      // Oscilador principal (campana suave)
      const oscMain = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscMain.type = "sine";
      oscMain.frequency.setValueAtTime(freq, startTime);

      // Armónico suave para timbre de campana de cocina
      oscHarmonic.type = "triangle";
      oscHarmonic.frequency.setValueAtTime(freq * 2, startTime);

      const harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.18, startTime);

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(gainPeak, startTime + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duration
      );

      oscMain.connect(gainNode);
      oscHarmonic.connect(harmonicGain);
      harmonicGain.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscMain.start(startTime);
      oscHarmonic.start(startTime);
      oscMain.stop(startTime + duration + 0.05);
      oscHarmonic.stop(startTime + duration + 0.05);
    };

    // Tono 1: "Ding" (Mi6 - 1318.5 Hz / Mi5 - 659.25 Hz)
    playTone(783.99, now, 0.55, 0.38); // Sol5
    // Tono 2: "Dong" (Do5 - 523.25 Hz)
    playTone(587.33, now + 0.32, 0.85, 0.42); // Re5

    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 1500);
  } catch {
    // Ignorar si el navegador bloquea Web Audio antes de interacción
  }
}

function formatHoraPedido(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    return fecha.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--";
  }
}

function esDeHoy(isoString: string): boolean {
  try {
    const fecha = new Date(isoString);
    const hoy = new Date();
    return (
      fecha.getFullYear() === hoy.getFullYear() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getDate() === hoy.getDate()
    );
  } catch {
    return true;
  }
}

export default function KitchenMonitor({
  localSlug,
  localNombre,
  accentBg,
  accentText,
  panelCardBg,
  subtitleText,
  onNotify,
}: KitchenMonitorProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [sonidoActivo, setSonidoActivo] = useState<boolean>(true);
  const [filtroVista, setFiltroVista] = useState<"activos" | "historial">(
    "activos"
  );
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [estadoConexion, setEstadoConexion] = useState<
    "conectado" | "reconectando"
  >("conectado");

  const sonidoActivoRef = useRef<boolean>(true);
  const idsConocidosRef = useRef<Set<string>>(new Set());
  const cargaInicialCompletaRef = useRef<boolean>(false);

  useEffect(() => {
    sonidoActivoRef.current = sonidoActivo;
  }, [sonidoActivo]);

  const cargarPedidos = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true);
      try {
        const res = await fetch(
          `/api/pedidos?local_slug=${encodeURIComponent(localSlug)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (res.ok && data.ok && Array.isArray(data.pedidos)) {
          setEstadoConexion("conectado");
          const lista: Pedido[] = data.pedidos;

          if (cargaInicialCompletaRef.current) {
            // Detectar si llegó algún pedido nuevo en estado 'pendiente'
            const nuevosPendientes = lista.filter(
              (p) =>
                !idsConocidosRef.current.has(p.id) && p.estado === "pendiente"
            );
            if (nuevosPendientes.length > 0) {
              for (const np of nuevosPendientes) {
                idsConocidosRef.current.add(np.id);
              }
              if (sonidoActivoRef.current) {
                playKitchenDingDongChime();
              }
              onNotify?.(
                `🔔 ¡Nuevo pedido de ${nuevosPendientes[0].cliente_nombre}!`
              );
            }
          }

          for (const p of lista) {
            idsConocidosRef.current.add(p.id);
          }
          cargaInicialCompletaRef.current = true;
          setPedidos(lista);
        } else {
          setEstadoConexion("reconectando");
        }
      } catch {
        setEstadoConexion("reconectando");
      } finally {
        if (!silencioso) setCargando(false);
      }
    },
    [localSlug, onNotify]
  );

  // Carga inicial + Suscripción Supabase Realtime con autoresiliencia de reconexión
  useEffect(() => {
    void cargarPedidos(false);

    const channel = supabase
      .channel(`kds-pedidos-${localSlug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `local_slug=eq.${localSlug}`,
        },
        (payload) => {
          setEstadoConexion("conectado");
          if (payload.eventType === "INSERT" && payload.new) {
            const nuevo = payload.new as Record<string, unknown>;
            const nuevoId = String(nuevo.id || "");
            const yaVisto = idsConocidosRef.current.has(nuevoId);
            idsConocidosRef.current.add(nuevoId);

            if (
              !yaVisto &&
              String(nuevo.estado || "pendiente") === "pendiente"
            ) {
              if (sonidoActivoRef.current) {
                playKitchenDingDongChime();
              }
              onNotify?.(
                `🔔 ¡Nuevo pedido recibido de ${String(
                  nuevo.cliente_nombre || "Cliente"
                )}!`
              );
            }
          }
          void cargarPedidos(true);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setEstadoConexion("conectado");
        } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          setEstadoConexion("reconectando");
          void cargarPedidos(true);
        } else if (status === "CLOSED") {
          setEstadoConexion("reconectando");
        }
      });

    // Escuchador de red nativo (se dispara si el Wi-Fi o 4G rural vuelve a estar disponible)
    const handleOnline = () => {
      setEstadoConexion("conectado");
      void cargarPedidos(false);
    };
    const handleOffline = () => {
      setEstadoConexion("reconectando");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Respaldo periódico cada 4 segundos por si los WebSockets se suspenden en modo pantalla fija
    const timer = setInterval(() => {
      void cargarPedidos(true);
    }, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [localSlug, cargarPedidos, onNotify]);

  const handleCambiarEstado = async (
    pedido: Pedido,
    nuevoEstado: EstadoPedido
  ) => {
    setActualizandoId(pedido.id);
    const estadoAnterior = pedido.estado;

    // Actualización optimista inmediata
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedido.id ? { ...p, estado: nuevoEstado } : p))
    );

    try {
      const res = await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId: pedido.id,
          estado: nuevoEstado,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPedidos((prev) =>
          prev.map((p) =>
            p.id === pedido.id ? { ...p, estado: estadoAnterior } : p
          )
        );
        return;
      }

      const etiquetaEstado =
        nuevoEstado === "preparando"
          ? "🍳 En preparación"
          : nuevoEstado === "listo"
          ? "✅ Pedido listo"
          : "📦 Pedido entregado";
      onNotify?.(`${etiquetaEstado}: ${pedido.cliente_nombre}`);
    } catch {
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedido.id ? { ...p, estado: estadoAnterior } : p
        )
      );
    } finally {
      setActualizandoId(null);
    }
  };

  const pedidosActivos = pedidos.filter(
    (p) =>
      p.estado === "pendiente" ||
      p.estado === "preparando" ||
      p.estado === "listo"
  );

  const pedidosHistorialHoy = pedidos.filter((p) => esDeHoy(p.created_at));

  const pedidosMostrados =
    filtroVista === "activos" ? pedidosActivos : pedidosHistorialHoy;

  const cantidadPendientes = pedidosActivos.filter(
    (p) => p.estado === "pendiente"
  ).length;

  return (
    <section
      className={`no-print rounded-3xl border p-5 shadow-xl ${panelCardBg}`}
    >
      {/* Cabecera del Monitor de Cocina */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${accentText}`}
          >
            <ChefHat className="h-4 w-4" />
            Sistema KDS en Tiempo Real
          </span>
          <div className="mt-0.5 flex items-center gap-2">
            <h2 className="text-base font-extrabold text-white sm:text-lg">
              👨‍🍳 Monitor de Cocina en Vivo
            </h2>
            {estadoConexion === "conectado" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-400/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En vivo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                Reconectando...
              </span>
            )}
          </div>
        </div>

        {/* Interruptor de Sonido + Botón Probar Timbre */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nuevo = !sonidoActivo;
              setSonidoActivo(nuevo);
              if (nuevo) {
                playKitchenDingDongChime();
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs font-extrabold shadow-sm transition active:scale-95 ${
              sonidoActivo
                ? "border-emerald-400/60 bg-emerald-600 text-white hover:bg-emerald-500"
                : "border-white/20 bg-white/10 text-white/75 hover:bg-white/20"
            }`}
          >
            {sonidoActivo ? (
              <>
                <Bell className="h-3.5 w-3.5" />
                <span>🔔 Sonido activado</span>
              </>
            ) : (
              <>
                <BellOff className="h-3.5 w-3.5" />
                <span>🔕 Sonido desactivado</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => playKitchenDingDongChime()}
            title="Probar timbre Ding-Dong de cocina"
            className="inline-flex items-center gap-1 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Probar timbre</span>
          </button>

          <button
            type="button"
            onClick={() => void cargarPedidos(false)}
            title="Actualizar comandas"
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${cargando ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <p className={`mt-1.5 text-xs ${subtitleText}`}>
        Las órdenes enviadas por los clientes desde la carta de{" "}
        <strong>{localNombre}</strong> aparecen aquí al instante con alerta
        sonora.
      </p>

      {/* Pestañas de Filtro: Activos vs Historial de hoy */}
      <div className="mt-4 flex items-center justify-between gap-2 border-b border-white/15 pb-3">
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex">
          <button
            type="button"
            onClick={() => setFiltroVista("activos")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              filtroVista === "activos"
                ? accentBg
                : "border border-white/20 bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            <span>Activos</span>
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-black">
              {pedidosActivos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroVista("historial")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              filtroVista === "historial"
                ? accentBg
                : "border border-white/20 bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            <span>Historial de hoy</span>
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-black">
              {pedidosHistorialHoy.length}
            </span>
          </button>
        </div>

        {cantidadPendientes > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/50 px-3 py-1 text-xs font-extrabold text-amber-200 animate-pulse">
            🔔 {cantidadPendientes}{" "}
            {cantidadPendientes === 1 ? "pedido nuevo" : "pedidos nuevos"}
          </span>
        )}
      </div>

      {/* Listado de Comandas / Tarjetas Kanban */}
      {cargando && pedidos.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className={`h-6 w-6 animate-spin ${accentText}`} />
        </div>
      ) : pedidosMostrados.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/25 p-6 text-center">
          <ChefHat className="mx-auto h-8 w-8 text-white/40" />
          <p className="mt-2 text-sm font-extrabold text-white">
            {filtroVista === "activos"
              ? "No hay comandas activas en este momento"
              : "Aún no se registran pedidos en el historial de hoy"}
          </p>
          <p className={`mt-1 text-xs ${subtitleText}`}>
            Cuando un cliente presione &ldquo;Enviar pedido a WhatsApp&rdquo;,
            la comanda aparecerá aquí automáticamente y sonará el timbre.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3.5">
          {pedidosMostrados.map((pedido) => {
            const codigoCorto = pedido.id.slice(0, 4).toUpperCase();
            const esPendiente = pedido.estado === "pendiente";
            const esPreparando = pedido.estado === "preparando";
            const esListo = pedido.estado === "listo";
            const esEntregado = pedido.estado === "entregado";

            const badgeEstilo = esPendiente
              ? "bg-amber-100 text-amber-900 border-amber-300"
              : esPreparando
              ? "bg-sky-100 text-sky-900 border-sky-300"
              : esListo
              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
              : "bg-slate-200 text-slate-700 border-slate-300";

            const textoEstado = esPendiente
              ? "🟡 Pendiente"
              : esPreparando
              ? "🍳 Preparando"
              : esListo
              ? "✅ Listo para entregar"
              : "📦 Entregado";

            const cardBorde = esPendiente
              ? "border-amber-400 ring-2 ring-amber-400/40"
              : esPreparando
              ? "border-sky-400"
              : esListo
              ? "border-emerald-400"
              : "border-slate-200 opacity-85";

            return (
              <article
                key={pedido.id}
                className={`rounded-2xl border-2 bg-white p-4 text-slate-900 shadow-lg transition-all ${cardBorde}`}
              >
                {/* Encabezado de la Comanda */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-xs font-black text-white">
                      #{codigoCorto}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-950 sm:text-base">
                        {pedido.cliente_nombre}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <Clock className="h-3 w-3" />
                        Llegó a las {formatHoraPedido(pedido.created_at)} hrs
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-extrabold ${badgeEstilo}`}
                  >
                    {textoEstado}
                  </span>
                </div>

                {/* Metadatos: Entrega, Ubicación/Mesa y Pago */}
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-800">
                    {pedido.tipo_entrega.toLowerCase().includes("mesa") ? (
                      <Utensils className="h-4 w-4 shrink-0 text-slate-700" />
                    ) : (
                      <Store className="h-4 w-4 shrink-0 text-slate-700" />
                    )}
                    <div className="min-w-0">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Modalidad / Ubicación
                      </span>
                      <span className="truncate block">
                        {pedido.tipo_entrega}
                        {pedido.direccion_mesa
                          ? ` · ${pedido.direccion_mesa}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-800">
                    {pedido.metodo_pago
                      .toLowerCase()
                      .includes("transferencia") ? (
                      <CreditCard className="h-4 w-4 shrink-0 text-emerald-700" />
                    ) : (
                      <Banknote className="h-4 w-4 shrink-0 text-amber-700" />
                    )}
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Método de Pago
                      </span>
                      <span>{pedido.metodo_pago}</span>
                    </div>
                  </div>
                </div>

                {/* Detalle de Ítems de la Comanda */}
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Detalle de la comanda
                  </span>
                  <ul className="divide-y divide-slate-200/80 text-xs sm:text-sm">
                    {pedido.items.map((item, idx) => (
                      <li
                        key={`${pedido.id}-item-${idx}`}
                        className="flex items-center justify-between gap-2 py-1.5 font-bold text-slate-900"
                      >
                        <span>
                          <strong className="mr-1.5 inline-block rounded-md bg-slate-900 px-1.5 py-0.5 text-xs font-black text-white">
                            {item.cantidad}x
                          </strong>
                          {item.nombre}
                        </span>
                        <span className="shrink-0 font-extrabold text-slate-700">
                          {formatCLP(item.subtotal || item.precio * item.cantidad)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-950">
                    <span>Total Pedido</span>
                    <span className="text-base text-emerald-700">
                      {formatCLP(pedido.total)}
                    </span>
                  </div>
                </div>

                {/* Notas de cocina si existen */}
                {pedido.notas && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <span>
                      <strong>Nota del cliente:</strong> {pedido.notas}
                    </span>
                  </div>
                )}

                {/* Botones de Acción Rápida para avanzar estado */}
                {!esEntregado ? (
                  <div className="mt-3.5">
                    {esPendiente && (
                      <button
                        type="button"
                        disabled={actualizandoId === pedido.id}
                        onClick={() =>
                          void handleCambiarEstado(pedido, "preparando")
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-black text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 sm:text-sm"
                      >
                        {actualizandoId === pedido.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span>🍳 Empezar Preparación</span>
                        )}
                      </button>
                    )}

                    {esPreparando && (
                      <button
                        type="button"
                        disabled={actualizandoId === pedido.id}
                        onClick={() =>
                          void handleCambiarEstado(pedido, "listo")
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-md transition hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 sm:text-sm"
                      >
                        {actualizandoId === pedido.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span>✅ Marcar Listo</span>
                        )}
                      </button>
                    )}

                    {esListo && (
                      <button
                        type="button"
                        disabled={actualizandoId === pedido.id}
                        onClick={() =>
                          void handleCambiarEstado(pedido, "entregado")
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 sm:text-sm"
                      >
                        {actualizandoId === pedido.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <PackageCheck className="h-4 w-4" />
                            <span>📦 Marcar Entregado</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Pedido completado y entregado</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
