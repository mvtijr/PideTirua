"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Maximize2,
  Minimize2,
  LogOut,
  Lock,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  Delete,
  Store,
} from "lucide-react";
import { Local } from "@/types/local";
import KitchenMonitor from "@/components/KitchenMonitor";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";

interface PedidosStaffClientProps {
  local: Local;
  initialAuthenticated?: boolean;
  tokenFromQuery?: string;
}

export default function PedidosStaffClient({
  local,
  initialAuthenticated = false,
  tokenFromQuery = "",
}: PedidosStaffClientProps) {
  const [autenticado, setAutenticado] = useState<boolean>(initialAuthenticated);
  const [pin, setPin] = useState<string>("");
  const [errorPin, setErrorPin] = useState<string | null>(null);
  const [validandoPin, setValidandoPin] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const tokenConsumidoRef = useRef<boolean>(false);

  const mostrarToast = (msg: string) => {
    setToastMensaje(msg);
  };

  useEffect(() => {
    if (!toastMensaje) return;
    const t = setTimeout(() => setToastMensaje(null), 3000);
    return () => clearTimeout(t);
  }, [toastMensaje]);

  // Si viene con token en la URL, intentar autenticación automática de 1 clic
  useEffect(() => {
    if (tokenConsumidoRef.current || autenticado || !tokenFromQuery) return;
    tokenConsumidoRef.current = true;

    const autenticarPorToken = async () => {
      setValidandoPin(true);
      try {
        const res = await fetch("/api/pedidos/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: local.slug, token: tokenFromQuery }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setAutenticado(true);
          mostrarToast("✅ Conectado a la pantalla de pedidos");
        } else {
          setErrorPin(data?.error || "El enlace de acceso no es válido o expiró.");
        }
      } catch {
        setErrorPin("Error de conexión al validar el enlace.");
      } finally {
        setValidandoPin(false);
      }
    };

    void autenticarPorToken();
  }, [local.slug, tokenFromQuery, autenticado]);

  // Escuchar cambios de pantalla completa
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignorar si el navegador bloquea fullscreen
    }
  };

  // Validar PIN de personal contra el servidor
  const validarPinPersonal = async (pinAValidar: string) => {
    if (pinAValidar.length !== 4 || validandoPin) return;
    setValidandoPin(true);
    setErrorPin(null);

    try {
      const res = await fetch("/api/pedidos/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: local.slug, pin: pinAValidar }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorPin(data?.error || "PIN de personal incorrecto.");
        setPin("");
        return;
      }

      setAutenticado(true);
      mostrarToast("✅ Acceso autorizado al Monitor de Pedidos");
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
      void validarPinPersonal(nuevoPin);
    }
  };

  const handleCerrarSesion = async () => {
    try {
      await fetch("/api/pedidos/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: local.slug, action: "logout" }),
      });
    } catch {
      // Ignorar
    }
    setAutenticado(false);
    setPin("");
  };

  const logoLocal = local.logo_url || local.logo || "/logo-pidetirua.jpg";

  // 1. PANTALLA DE ACCESO POR PIN DE PERSONAL (Si no está autenticado)
  if (!autenticado) {
    return (
      <main className="relative min-h-screen w-full bg-[#FAF8F5] text-[#18181B] font-body flex flex-col justify-between selection:bg-[#EA580C] selection:text-white overflow-hidden p-4 sm:p-6">
        <GradientBackground
          gradientType="radial-gradient"
          gradientOrigin="top-middle"
          gradientSize="140% 120%"
          colors={[
            { color: "rgba(254, 240, 218, 0.75)", stop: "0%" },
            { color: "rgba(254, 215, 170, 0.4)", stop: "30%" },
            { color: "rgba(250, 248, 245, 0.85)", stop: "65%" },
            { color: "rgba(250, 248, 245, 1)", stop: "100%" },
          ]}
          noiseIntensity={0.65}
          noisePatternAlpha={34}
          noisePatternSize={90}
          noisePatternRefreshInterval={0}
        />

        {/* Cabecera superior simple */}
        <div className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between">
          <Link
            href={`/${local.slug}`}
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Ver Carta Digital</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#C2410C]">
            <Receipt className="h-3 w-3" />
            Pantalla de Pedidos
          </span>
        </div>

        {/* Tarjeta de Entrada de PIN */}
        <div className="relative z-10 w-full max-w-sm mx-auto my-auto rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-stone-200/50 text-center space-y-5">
          {/* Logo del Local */}
          <div className="mx-auto h-20 w-20 rounded-full border-2 border-stone-200 bg-white p-1 shadow-xs overflow-hidden">
            <img
              src={logoLocal}
              alt={local.nombre}
              width={80}
              height={80}
              className="h-full w-full object-contain rounded-full"
            />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 block mb-0.5">
              {local.nombre}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#18181B] leading-tight">
              Monitor de Pedidos
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Ingresa el <strong className="text-stone-900">PIN de Personal</strong> de 4 dígitos para ver las comandas en tiempo real.
            </p>
          </div>

          {/* Indicador visual de los 4 dígitos */}
          <div className="flex items-center justify-center gap-3 py-1">
            {[0, 1, 2, 3].map((idx) => {
              const tieneDigito = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`h-4 w-4 rounded-full transition-all duration-200 ${
                    tieneDigito
                      ? "scale-110 bg-[#EA580C] ring-4 ring-orange-200"
                      : "bg-stone-200"
                  }`}
                />
              );
            })}
          </div>

          {errorPin && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorPin}</span>
            </div>
          )}

          {/* Teclado Numérico Táctil */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                disabled={validandoPin}
                onClick={() => handleDigitoPin(num)}
                className="h-12 sm:h-14 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-lg sm:text-xl font-bold font-mono text-stone-800 transition active:scale-95 disabled:opacity-50"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={validandoPin || pin.length === 0}
              onClick={() => setPin("")}
              className="h-12 sm:h-14 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-rose-50 hover:border-rose-200 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-rose-600 transition active:scale-95 disabled:opacity-40"
            >
              Borrar
            </button>

            <button
              type="button"
              disabled={validandoPin}
              onClick={() => handleDigitoPin("0")}
              className="h-12 sm:h-14 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-lg sm:text-xl font-bold font-mono text-stone-800 transition active:scale-95 disabled:opacity-50"
            >
              0
            </button>

            <button
              type="button"
              disabled={validandoPin || pin.length === 0}
              onClick={() => setPin((prev) => prev.slice(0, -1))}
              className="h-12 sm:h-14 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition active:scale-95 flex items-center justify-center disabled:opacity-40"
              aria-label="Retroceso"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          {validandoPin && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#EA580C] pt-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {tokenFromQuery && pin.length === 0
                  ? "Verificando enlace de acceso..."
                  : "Verificando PIN de personal..."}
              </span>
            </div>
          )}

          <div className="border-t border-stone-200/80 pt-3 text-[11px] text-stone-400">
            <span>¿Clave por defecto? Prueba con </span>
            <strong className="text-stone-700 font-mono">0000</strong>
            <span>. El dueño puede cambiarla desde su panel.</span>
          </div>
        </div>

        {/* Pie mínimo */}
        <div className="relative z-10 text-center text-xs text-stone-400">
          <span>¿Eres el dueño del local? </span>
          <Link
            href={`/admin/${local.slug}`}
            className="font-bold text-[#EA580C] hover:text-[#c2410c] hover:underline"
          >
            Ingresar al Panel de Administrador
          </Link>
        </div>
      </main>
    );
  }

  // 2. PANTALLA COMPLETA DE TRABAJADORES (AUTENTICADO)
  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-stone-900 font-body flex flex-col selection:bg-[#EA580C] selection:text-white">
      {/* Toast Flotante */}
      {toastMensaje && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl bg-stone-900 text-white px-4 py-2.5 text-xs font-bold shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
          {toastMensaje}
        </div>
      )}

      {/* Barra Superior Especial KDS / Tablet */}
      <header className="sticky top-0 z-30 w-full border-b border-stone-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          {/* Identidad del Local */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-stone-200 bg-white p-0.5 shadow-xs shrink-0 overflow-hidden">
              <img
                src={logoLocal}
                alt={local.nombre}
                width={40}
                height={40}
                className="h-full w-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg tracking-wide uppercase text-stone-900 font-bold truncate">
                  {local.nombre}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Pantalla Personal
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block -mt-0.5 truncate">
                Comandas y Pedidos en Vivo
              </span>
            </div>
          </div>

          {/* Acciones de la Pantalla */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botón Pantalla Completa para Tablets */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Salir de pantalla completa" : "Modo pantalla completa para tablet"}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 px-3 py-1.5 text-xs font-bold transition active:scale-95 shadow-xs"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Normal</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pantalla Completa</span>
                </>
              )}
            </button>

            {/* Salir */}
            <button
              type="button"
              onClick={handleCerrarSesion}
              title="Cerrar sesión en esta pantalla"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-stone-600 px-3 py-1.5 text-xs font-bold transition active:scale-95 shadow-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Monitor de Pedidos Puro (KDS) */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1400px] w-full mx-auto">
        <KitchenMonitor
          localSlug={local.slug}
          localNombre={local.nombre}
          accentBg="bg-[#EA580C]"
          accentText="text-[#C2410C]"
          panelCardBg="bg-white"
          subtitleText="Comandas de cocina y despacho"
          onNotify={mostrarToast}
        />
      </main>

      {/* Pie sutil de seguridad */}
      <footer className="w-full border-t border-stone-200/80 bg-white/70 py-2.5 px-4 text-center text-[11px] text-stone-400">
        <span>🔒 Modo Personal — Los precios, finanzas y administración de la carta están protegidos en el panel del dueño.</span>
      </footer>
    </div>
  );
}
