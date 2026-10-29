"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Moon,
  Receipt,
  X,
  Banknote,
  CreditCard,
  TrendingUp,
  MessageCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Store,
  CheckCircle2,
} from "lucide-react";
import { Pedido } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface ModalCierreCajaProps {
  isOpen: boolean;
  onClose: () => void;
  localSlug: string;
  localNombre: string;
  telefonoWhatsapp: string;
}

export default function ModalCierreCaja({
  isOpen,
  onClose,
  localSlug,
  localNombre,
  telefonoWhatsapp,
}: ModalCierreCajaProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/pedidos?local_slug=${encodeURIComponent(localSlug)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.ok && Array.isArray(data.pedidos)) {
        setPedidos(data.pedidos);
      } else {
        setError(data.error || "No se pudieron obtener las comandas");
      }
    } catch {
      setError("Error de conexión al cargar pedidos de hoy");
    } finally {
      setCargando(false);
    }
  }, [localSlug]);

  useEffect(() => {
    if (isOpen) {
      void cargarPedidos();
    }
  }, [isOpen, cargarPedidos]);

  // Bloquear scroll de fondo cuando el modal esté abierto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

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

  // Fecha de hoy en formato de Chile
  const fechaChileISO = useMemo(() => {
    return new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Santiago",
    }); // YYYY-MM-DD
  }, []);

  const fechaFormateada = useMemo(() => {
    return new Date().toLocaleDateString("es-CL", {
      timeZone: "America/Santiago",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Filtrar comandas de hoy que no estén canceladas
  const pedidosHoy = useMemo(() => {
    return pedidos.filter((p) => {
      if (p.estado === "cancelado") return false;
      const f = new Date(p.created_at).toLocaleDateString("en-CA", {
        timeZone: "America/Santiago",
      });
      return f === fechaChileISO;
    });
  }, [pedidos, fechaChileISO]);

  // Desglose de Efectivo
  const pedidosEfectivo = useMemo(() => {
    return pedidosHoy.filter(
      (p) =>
        p.metodo_pago === "Efectivo" ||
        (p.metodo_pago as string)?.toLowerCase().includes("efectivo")
    );
  }, [pedidosHoy]);

  const totalEfectivo = useMemo(() => {
    return pedidosEfectivo.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  }, [pedidosEfectivo]);

  // Desglose de Transferencias CuentaRUT
  const pedidosTransferencia = useMemo(() => {
    return pedidosHoy.filter(
      (p) =>
        p.metodo_pago === "Transferencia" ||
        (p.metodo_pago as string)?.toLowerCase().includes("transf")
    );
  }, [pedidosHoy]);

  const totalTransferencia = useMemo(() => {
    return pedidosTransferencia.reduce(
      (acc, p) => acc + (Number(p.total) || 0),
      0
    );
  }, [pedidosTransferencia]);

  // Total General
  const totalGeneral = totalEfectivo + totalTransferencia;
  const totalPedidos = pedidosHoy.length;

  if (!isOpen) return null;

  // Generar reporte estructurado para WhatsApp
  const handleEnviarWhatsApp = () => {
    const telefonoLimpio = telefonoWhatsapp.replace(/\D/g, "");
    const mensaje = `📊 *CIERRE DE CAJA - ${localNombre}*
📅 Fecha: ${fechaFormateada}

💵 Efectivo en Caja: ${formatCLP(totalEfectivo)} (${pedidosEfectivo.length} pedidos)
💳 Transferencias CuentaRUT: ${formatCLP(totalTransferencia)} (${pedidosTransferencia.length} pedidos)

💰 *TOTAL DEL DÍA: ${formatCLP(totalGeneral)}* (${totalPedidos} pedidos)

¡Turno cerrado con éxito!`;

    const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(
      mensaje
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cierre-caja-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Contenedor Modal */}
      <div className="relative w-full max-w-lg rounded-3xl bg-stone-50 border border-stone-200/90 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-amber-400">
              <Moon className="h-5 w-5" />
            </span>
            <div>
              <h3
                id="modal-cierre-caja-title"
                className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-stone-900 leading-tight"
              >
                Cierre de Caja de Hoy
              </h3>
              <p className="text-xs font-semibold text-stone-500 capitalize">
                {fechaFormateada}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de cierre de caja"
            className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-500">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider">
                Calculando cuadre de turnos...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-700">
              {error}
            </div>
          ) : (
            <>
              {/* Tarjetas de Métricas Desglosadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Efectivo */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                      <Banknote className="h-4 w-4" />
                    </span>
                    <span className="tabular-nums rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      {pedidosEfectivo.length} pedidos
                    </span>
                  </div>
                  <span className="mt-2 block text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Efectivo en Caja
                  </span>
                  <span className="tabular-nums mt-0.5 block font-display text-2xl font-bold tracking-tight text-emerald-950">
                    {formatCLP(totalEfectivo)}
                  </span>
                </div>

                {/* 2. Transferencias */}
                <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white shadow-xs">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <span className="tabular-nums rounded-full bg-sky-100 border border-sky-200 px-2 py-0.5 text-[10px] font-extrabold text-sky-800">
                      {pedidosTransferencia.length} pedidos
                    </span>
                  </div>
                  <span className="mt-2 block text-xs font-bold uppercase tracking-wider text-sky-800">
                    Transferencias CuentaRUT
                  </span>
                  <span className="tabular-nums mt-0.5 block font-display text-2xl font-bold tracking-tight text-sky-950">
                    {formatCLP(totalTransferencia)}
                  </span>
                </div>
              </div>

              {/* 3. Total General Destacado */}
              <div className="rounded-2xl border-2 border-stone-900 bg-stone-900 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Total Recaudado del Día
                    </span>
                  </div>
                  <span className="tabular-nums rounded-full bg-stone-800 px-2.5 py-0.5 text-xs font-bold text-stone-300 border border-stone-700">
                    {totalPedidos} órdenes atendidas
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="tabular-nums font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {formatCLP(totalGeneral)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-stone-400 font-medium">
                  Suma consolidada de todas las ventas no canceladas de hoy.
                </p>
              </div>

              {/* Botón de refresco manual */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => void cargarPedidos()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition shadow-2xs"
                >
                  <RefreshCw className="h-4 w-4 text-stone-600" />
                  <span>Actualizar cifras</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Barra de Acciones */}
        <div className="border-t border-stone-200 bg-white px-5 py-4 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleEnviarWhatsApp}
            disabled={cargando}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 text-xs sm:text-sm font-display uppercase tracking-wider shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" />
            <span>📲 Enviar Resumen a mi WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-3 text-xs font-bold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
