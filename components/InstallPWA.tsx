"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X, Share, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWA() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [mostrarGuiaManual, setMostrarGuiaManual] = useState<boolean>(false);
  const [esIOS, setEsIOS] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Registrar Service Worker para habilitar instalación PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // 1. Detectar si ya está instalada o ejecutándose como app nativa (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      try {
        localStorage.setItem("pidetirua_pwa_installed", "true");
      } catch {
        // Ignorar en navegación privada
      }
      setVisible(false);
      return;
    }

    // 2. Comprobar si el usuario ya la instaló o decidió cerrar el anuncio previamente
    try {
      const yaInstalada = localStorage.getItem("pidetirua_pwa_installed") === "true";
      const descartada = localStorage.getItem("pidetirua_pwa_dismissed") === "true";

      if (yaInstalada || descartada) {
        setVisible(false);
        return;
      }
    } catch {
      // Ignorar si localStorage está bloqueado
    }

    // 3. Detectar si es iOS (Safari no soporta beforeinstallprompt automático)
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDetected = /iphone|ipad|ipod/.test(ua);
    setEsIOS(iosDetected);

    // En iOS solo mostramos si nunca ha sido descartada
    if (iosDetected) {
      setVisible(true);
    }

    // Evento nativo de Chrome / Edge / Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    // Evento disparado automáticamente por el navegador cuando la app se instala con éxito
    const handleAppInstalled = () => {
      try {
        localStorage.setItem("pidetirua_pwa_installed", "true");
      } catch {
        // Ignorar
      }
      setDeferredPrompt(null);
      setVisible(false);
      setMostrarGuiaManual(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // No mostrar en paneles de administración, superadmin ni monitor de cocina/pedidos
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/superadmin") ||
    pathname?.startsWith("/pedidos")
  ) {
    return null;
  }

  const handleInstalarClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          try {
            localStorage.setItem("pidetirua_pwa_installed", "true");
          } catch {
            // Ignorar
          }
          setVisible(false);
        }
        setDeferredPrompt(null);
      } catch {
        setMostrarGuiaManual(true);
      }
      return;
    }

    setMostrarGuiaManual((prev) => !prev);
  };

  const handleCerrarBanner = () => {
    setVisible(false);
    setMostrarGuiaManual(false);
    try {
      // Guardar de forma persistente en localStorage para no volver a molestar
      localStorage.setItem("pidetirua_pwa_dismissed", "true");
    } catch {
      // Ignorar
    }
  };

  if (!visible) return null;

  return (
    <div className="no-print relative z-40 border-b border-stone-800 bg-[#18181B] px-3.5 py-2 text-white shadow-md animate-in fade-in duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Smartphone className="h-4 w-4 text-[#EA580C] shrink-0" />
          <p className="text-[11px] font-bold leading-snug text-stone-200 sm:text-xs truncate">
            Instala <strong>PideTirúa</strong> en tu celular para pedir más rápido
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void handleInstalarClick()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#EA580C] hover:bg-[#c2410c] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white shadow-sm transition active:scale-95 sm:text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Instalar</span>
          </button>

          <button
            type="button"
            onClick={handleCerrarBanner}
            title="Cerrar y no volver a mostrar"
            aria-label="Cerrar aviso de instalación"
            className="rounded-full p-1 text-stone-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mostrarGuiaManual && (
        <div className="mx-auto mt-2 max-w-xl rounded-2xl border border-stone-700 bg-stone-900/95 px-4 py-3 text-xs leading-relaxed text-stone-300 shadow-xl backdrop-blur-md">
          {esIOS ? (
            <p className="flex items-center gap-2">
              <Share className="h-4 w-4 shrink-0 text-[#EA580C]" />
              <span>
                En iPhone/iPad: presiona el botón <strong className="text-white">Compartir</strong> de Safari (cuadrado con flecha) y selecciona{" "}
                <strong className="text-white">&ldquo;Agregar a pantalla de inicio&rdquo;</strong>.
              </span>
            </p>
          ) : (
            <p>
              💡 Toca los tres puntos de tu navegador (<strong className="text-white">⋮</strong>) y selecciona{" "}
              <strong className="text-white">&ldquo;Instalar aplicación&rdquo;</strong> o{" "}
              <strong className="text-white">&ldquo;Agregar a la pantalla principal&rdquo;</strong>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
