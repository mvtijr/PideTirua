"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lock,
  LogOut,
  CheckCircle2,
  ExternalLink,
  Store,
  Delete,
  Check,
  Loader2,
  Sparkles,
  ArrowLeft,
  DollarSign,
} from "lucide-react";
import { Local, Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";

interface AdminLocalClientProps {
  initialLocal: Local;
  initialAuthenticated?: boolean;
}

export default function AdminLocalClient({
  initialLocal,
  initialAuthenticated = false,
}: AdminLocalClientProps) {
  const sessionKey = `pidetirua_admin_session_${initialLocal.slug}`;

  const [local, setLocal] = useState<Local>(initialLocal);
  const [autenticado, setAutenticado] = useState<boolean>(initialAuthenticated);
  const [verificandoSesion, setVerificandoSesion] = useState<boolean>(
    !initialAuthenticated
  );

  // Estado del bloqueo por PIN
  const [pin, setPin] = useState<string>("");
  const [errorPin, setErrorPin] = useState<string | null>(null);
  const [validandoPin, setValidandoPin] = useState<boolean>(false);

  // Estado de guardado y Toast de feedback inmediato
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // Estado local de edición rápida de nombre y precio por producto
  const [ediciones, setEdiciones] = useState<
    Record<string, { nombre: string; precio: string }>
  >(() => {
    const map: Record<string, { nombre: string; precio: string }> = {};
    for (const cat of initialLocal.categorias) {
      for (const prod of cat.productos) {
        map[prod.id] = {
          nombre: prod.nombre,
          precio: String(prod.precio),
        };
      }
    }
    return map;
  });

  // Sincronizar mapa de ediciones cuando cambia `local`
  useEffect(() => {
    const map: Record<string, { nombre: string; precio: string }> = {};
    for (const cat of local.categorias) {
      for (const prod of cat.productos) {
        map[prod.id] = {
          nombre: prod.nombre,
          precio: String(prod.precio),
        };
      }
    }
    setEdiciones(map);
  }, [local]);

  // Revisar sesión guardada en navegador o cookie al montar
  useEffect(() => {
    if (initialAuthenticated) {
      setAutenticado(true);
      setVerificandoSesion(false);
      return;
    }
    try {
      const guardado = localStorage.getItem(sessionKey);
      if (guardado === "authenticated") {
        setAutenticado(true);
      }
    } catch {
      // Ignorar errores de acceso a localStorage
    } finally {
      setVerificandoSesion(false);
    }
  }, [initialAuthenticated, sessionKey]);

  const mostrarToast = (mensaje = "Cambio guardado") => {
    setToastMensaje(mensaje);
  };

  useEffect(() => {
    if (!toastMensaje) return;
    const timer = setTimeout(() => {
      setToastMensaje(null);
    }, 2600);
    return () => clearTimeout(timer);
  }, [toastMensaje]);

  // Validar PIN contra Supabase
  const validarPin = async (pinAValidar: string) => {
    if (pinAValidar.length !== 4 || validandoPin) return;
    setValidandoPin(true);
    setErrorPin(null);

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-pin", pin: pinAValidar }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorPin(data.error || "PIN incorrecto. Intenta nuevamente.");
        setPin("");
        return;
      }

      try {
        localStorage.setItem(sessionKey, "authenticated");
        document.cookie = `pidetirua_admin_${local.slug}=authenticated; path=/; max-age=604800; SameSite=Lax`;
      } catch {
        // Ignorar errores en modo privado
      }

      setAutenticado(true);
      mostrarToast("Sesión iniciada correctamente");
    } catch {
      setErrorPin("Error de conexión al verificar el PIN.");
    } finally {
      setValidandoPin(false);
    }
  };

  const handleDigitoPin = (digito: string) => {
    if (pin.length >= 4 || validandoPin) return;
    const nuevoPin = `${pin}${digito}`;
    setPin(nuevoPin);
    setErrorPin(null);
    if (nuevoPin.length === 4) {
      void validarPin(nuevoPin);
    }
  };

  const handleBorrarDigito = () => {
    if (validandoPin) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorPin(null);
  };

  const handleCerrarSesion = async () => {
    try {
      localStorage.removeItem(sessionKey);
      document.cookie = `pidetirua_admin_${local.slug}=; path=/; max-age=0`;
      await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {
      // Ignorar
    }
    setPin("");
    setAutenticado(false);
  };

  // Cambiar estado Abierto / Cerrado del local en tiempo real
  const handleToggleAbierto = async () => {
    const nuevoEstado = !local.abierto;
    const estadoAnterior = local.abierto;

    // Actualización optimista inmediata
    setLocal((prev) => ({ ...prev, abierto: nuevoEstado }));
    setGuardandoId("local-abierto");

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-abierto",
          abierto: nuevoEstado,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLocal((prev) => ({ ...prev, abierto: estadoAnterior }));
        return;
      }
      if (data.local) {
        setLocal(data.local);
      }
      mostrarToast(
        nuevoEstado
          ? "Cambio guardado: 🟢 Local Abierto"
          : "Cambio guardado: 🔴 Local Cerrado"
      );
    } catch {
      setLocal((prev) => ({ ...prev, abierto: estadoAnterior }));
    } finally {
      setGuardandoId(null);
    }
  };

  // Cambiar switch Disponible / Agotado de un producto en tiempo real
  const handleToggleDisponible = async (producto: Producto) => {
    const disponibleActual = producto.disponible !== false;
    const nuevoDisponible = !disponibleActual;

    // Actualización optimista inmediata
    setLocal((prev) => ({
      ...prev,
      categorias: prev.categorias.map((cat) => ({
        ...cat,
        productos: cat.productos.map((p) =>
          p.id === producto.id ? { ...p, disponible: nuevoDisponible } : p
        ),
      })),
    }));
    setGuardandoId(`disp-${producto.id}`);

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-producto",
          productoId: producto.id,
          disponible: nuevoDisponible,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
      }
      mostrarToast(
        nuevoDisponible
          ? `Cambio guardado: "${producto.nombre}" Disponible`
          : `Cambio guardado: "${producto.nombre}" Agotado`
      );
    } finally {
      setGuardandoId(null);
    }
  };

  // Guardar edición rápida de Nombre y Precio de un producto
  const handleGuardarNombrePrecio = async (producto: Producto) => {
    const edicion = ediciones[producto.id];
    if (!edicion) return;

    const nombreLimpio = edicion.nombre.trim();
    const precioNumero = Number(
      String(edicion.precio).replace(/[^0-9]/g, "")
    );

    if (!nombreLimpio || Number.isNaN(precioNumero) || precioNumero <= 0) {
      return;
    }

    if (
      nombreLimpio === producto.nombre &&
      precioNumero === producto.precio
    ) {
      return;
    }

    // Actualización optimista
    setLocal((prev) => ({
      ...prev,
      categorias: prev.categorias.map((cat) => ({
        ...cat,
        productos: cat.productos.map((p) =>
          p.id === producto.id
            ? { ...p, nombre: nombreLimpio, precio: precioNumero }
            : p
        ),
      })),
    }));
    setGuardandoId(`edit-${producto.id}`);

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-producto",
          productoId: producto.id,
          nombre: nombreLimpio,
          precio: precioNumero,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
      }
      mostrarToast("Cambio guardado");
    } finally {
      setGuardandoId(null);
    }
  };

  if (verificandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // ============================================================================
  // 1. PANTALLA DE BLOQUEO POR PIN (4 DÍGITOS)
  // ============================================================================
  if (!autenticado) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-slate-950 px-4 py-6 text-white">
        {/* Barra superior */}
        <div className="mx-auto flex w-full max-w-sm items-center justify-between">
          <Link
            href={`/${local.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a la carta</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
            <Lock className="h-3 w-3" />
            Admin Móvil
          </span>
        </div>

        {/* Tarjeta central de PIN */}
        <div className="mx-auto my-auto w-full max-w-sm py-4">
          <div className="text-center">
            <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/20 bg-white p-1 shadow-xl">
              <img
                src={local.logo}
                alt={local.nombre}
                className="h-full w-full rounded-xl object-contain"
              />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              {local.nombre}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Ingresa el PIN de 4 dígitos para administrar tu local
            </p>
          </div>

          {/* Indicadores visuales de los 4 dígitos + Input oculto accesible */}
          <div className="mt-6 flex flex-col items-center">
            <div className="flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const digito = pin[idx];
                const activo = pin.length === idx;
                return (
                  <div
                    key={idx}
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all ${
                      digito
                        ? "border-emerald-400 bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/10"
                        : activo
                        ? "border-sky-400 bg-slate-900 text-white"
                        : "border-slate-800 bg-slate-900/70 text-slate-600"
                    }`}
                  >
                    {digito ? "●" : ""}
                  </div>
                );
              })}
            </div>

            {/* Input numérico directo para teclado físico o móvil */}
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const soloNumeros = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 4);
                setPin(soloNumeros);
                setErrorPin(null);
                if (soloNumeros.length === 4) {
                  void validarPin(soloNumeros);
                }
              }}
              placeholder="Ingresa tu PIN de 4 dígitos"
              aria-label="PIN de 4 dígitos"
              className="mt-3 w-48 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-center text-xs text-slate-300 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />

            {errorPin && (
              <p className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-center text-xs font-bold text-rose-300">
                {errorPin}
              </p>
            )}
          </div>

          {/* Teclado Numérico Táctil Mobile-First */}
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                disabled={validandoPin}
                onClick={() => handleDigitoPin(num)}
                className="flex h-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-xl font-extrabold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={validandoPin || pin.length === 0}
              onClick={() => {
                setPin("");
                setErrorPin(null);
              }}
              className="flex h-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-xs font-bold text-slate-400 transition hover:bg-slate-800 active:scale-95 disabled:opacity-40"
            >
              Limpiar
            </button>

            <button
              type="button"
              disabled={validandoPin}
              onClick={() => handleDigitoPin("0")}
              className="flex h-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-xl font-extrabold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              0
            </button>

            <button
              type="button"
              disabled={validandoPin || pin.length === 0}
              onClick={handleBorrarDigito}
              aria-label="Borrar último dígito"
              className="flex h-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-300 transition hover:bg-slate-800 active:scale-95 disabled:opacity-40"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            disabled={pin.length !== 4 || validandoPin}
            onClick={() => void validarPin(pin)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
          >
            {validandoPin ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando PIN...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Desbloquear Panel</span>
              </>
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          PideTirúa Admin · Gestión conectada a Supabase en tiempo real
        </p>
      </div>
    );
  }

  // ============================================================================
  // 2. PANEL PRINCIPAL DE ADMINISTRACIÓN MÓVIL (UNA VEZ AUTENTICADO)
  // ============================================================================
  const totalProductos = local.categorias.reduce(
    (acc, cat) => acc + cat.productos.length,
    0
  );
  const productosDisponibles = local.categorias.reduce(
    (acc, cat) =>
      acc + cat.productos.filter((p) => p.disponible !== false).length,
    0
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-20 text-slate-900">
      {/* Toast flotante de confirmación inmediata ("Cambio guardado") */}
      {toastMensaje && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-xl transition-all"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Cabecera Fija Mobile-First */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={local.logo}
              alt={local.nombre}
              className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-0.5 shadow-2xs"
            />
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                Panel de Administración
              </span>
              <h1 className="truncate text-base font-extrabold text-slate-900 sm:text-lg">
                {local.nombre}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/${local.slug}`}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              title="Ver carta pública"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver Carta</span>
            </Link>

            <button
              type="button"
              onClick={handleCerrarSesion}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-4 pt-5">
        {/* CONTROL MAESTRO: Switch grande para estado Abierto / Cerrado */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <Store className="h-4 w-4 text-slate-700" />
              Control Maestro del Local
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Horario: {local.horario}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-600">
            Toca el botón para abrir o cerrar la recepción de pedidos por
            WhatsApp al instante:
          </p>

          <button
            type="button"
            disabled={guardandoId === "local-abierto"}
            onClick={handleToggleAbierto}
            className={`mt-4 flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left shadow-md transition-all active:scale-[0.99] ${
              local.abierto
                ? "border-emerald-500 bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-500"
                : "border-rose-500 bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-500"
            }`}
          >
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-white/85">
                Estado actual en vivo
              </span>
              <span className="mt-0.5 block text-lg font-black sm:text-xl">
                {local.abierto ? "🟢 Local Abierto" : "🔴 Local Cerrado"}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-white/90">
                {local.abierto
                  ? "Recibiendo pedidos en la carta digital"
                  : "Carrito bloqueado · Solo lectura de carta"}
              </span>
            </div>

            {/* Switch visual grande */}
            <div className="flex flex-col items-end gap-1">
              <div
                className={`relative flex h-9 w-16 items-center rounded-full p-1 transition-colors ${
                  local.abierto ? "bg-emerald-900/40" : "bg-rose-900/40"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full bg-white shadow-md transition-transform ${
                    local.abierto ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                {guardandoId === "local-abierto"
                  ? "Guardando..."
                  : "Tocar para cambiar"}
              </span>
            </div>
          </button>

          {/* Resumen rápido de carta */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 text-center">
            <div className="rounded-2xl bg-emerald-50 p-2.5 border border-emerald-100">
              <span className="block text-lg font-black text-emerald-700">
                {productosDisponibles}
              </span>
              <span className="text-[11px] font-bold text-emerald-800">
                Platos Disponibles
              </span>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2.5 border border-slate-200">
              <span className="block text-lg font-black text-slate-700">
                {totalProductos - productosDisponibles}
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                Platos Agotados
              </span>
            </div>
          </div>
        </section>

        {/* LISTADO DE PRODUCTOS AGRUPADOS POR CATEGORÍA */}
        <div className="space-y-6">
          {local.categorias.map((categoria) => (
            <section
              key={categoria.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5"
            >
              <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                  {categoria.nombre}
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  {categoria.productos.length}{" "}
                  {categoria.productos.length === 1 ? "producto" : "productos"}
                </span>
              </div>

              <div className="space-y-3.5">
                {categoria.productos.map((producto) => {
                  const disponible = producto.disponible !== false;
                  const editState = ediciones[producto.id] ?? {
                    nombre: producto.nombre,
                    precio: String(producto.precio),
                  };
                  const precioNumerico = Number(
                    String(editState.precio).replace(/[^0-9]/g, "")
                  );
                  const hayCambiosSinGuardar =
                    editState.nombre.trim() !== producto.nombre ||
                    precioNumerico !== producto.precio;

                  return (
                    <div
                      key={producto.id}
                      className={`rounded-2xl border p-3.5 transition-all ${
                        disponible
                          ? "border-slate-200 bg-white"
                          : "border-slate-200 bg-slate-50 opacity-85"
                      }`}
                    >
                      {/* Fila superior: miniatura + switch directo Disponible / Agotado */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={producto.imagen_url || producto.imagen}
                            alt={producto.nombre}
                            className={`h-11 w-11 shrink-0 rounded-xl object-cover border border-slate-200 ${
                              !disponible ? "grayscale opacity-60" : ""
                            }`}
                          />
                          <div className="min-w-0">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                                disponible
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {disponible ? "🟢 Disponible" : "⚪ Agotado"}
                            </span>
                            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                              Precio actual: {formatCLP(producto.precio)}
                            </p>
                          </div>
                        </div>

                        {/* Switch directo: [Disponible / Agotado] */}
                        <button
                          type="button"
                          disabled={guardandoId === `disp-${producto.id}`}
                          onClick={() => handleToggleDisponible(producto)}
                          className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition active:scale-95 ${
                            disponible
                              ? "border-emerald-300 bg-emerald-600 text-white shadow-xs hover:bg-emerald-500"
                              : "border-slate-300 bg-slate-200 text-slate-700 hover:bg-slate-300"
                          }`}
                        >
                          <div
                            className={`relative flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                              disponible ? "bg-emerald-900/40" : "bg-slate-400"
                            }`}
                          >
                            <div
                              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                disponible ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </div>
                          <span>{disponible ? "Disponible" : "Agotado"}</span>
                        </button>
                      </div>

                      {/* Fila inferior: Edición rápida de Nombre y Precio */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                        <div className="sm:col-span-7">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Nombre del plato
                          </label>
                          <input
                            type="text"
                            value={editState.nombre}
                            onChange={(e) =>
                              setEdiciones((prev) => ({
                                ...prev,
                                [producto.id]: {
                                  ...editState,
                                  nombre: e.target.value,
                                },
                              }))
                            }
                            onBlur={() => {
                              if (hayCambiosSinGuardar) {
                                void handleGuardarNombrePrecio(producto);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="flex items-end gap-2 sm:col-span-5">
                          <div className="flex-1">
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Precio (CLP)
                            </label>
                            <div className="relative">
                              <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                              <input
                                type="number"
                                inputMode="numeric"
                                value={editState.precio}
                                onChange={(e) =>
                                  setEdiciones((prev) => ({
                                    ...prev,
                                    [producto.id]: {
                                      ...editState,
                                      precio: e.target.value,
                                    },
                                  }))
                                }
                                onBlur={() => {
                                  if (hayCambiosSinGuardar) {
                                    void handleGuardarNombrePrecio(producto);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-7 pr-2.5 text-xs font-extrabold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={
                              !hayCambiosSinGuardar ||
                              guardandoId === `edit-${producto.id}`
                            }
                            onClick={() =>
                              void handleGuardarNombrePrecio(producto)
                            }
                            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl px-3 text-xs font-extrabold transition ${
                              hayCambiosSinGuardar
                                ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-500 active:scale-95"
                                : "border border-slate-200 bg-slate-100 text-slate-400"
                            }`}
                            title="Guardar cambios de nombre y precio"
                          >
                            {guardandoId === `edit-${producto.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            <span>Guardar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
