"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWA() {
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

    // No mostrar si ya está instalada en modo standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) {
      setVisible(false);
      return;
    }

    try {
      if (sessionStorage.getItem("pidetirua_pwa_dismissed") === "1") {
        return;
      }
    } catch {
      // Ignorar
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDetected = /iphone|ipad|ipod/.test(ua);
    setEsIOS(iosDetected);
    setVisible(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
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

  const handleInstalarClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
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
      sessionStorage.setItem("pidetirua_pwa_dismissed", "1");
    } catch {
      // Ignorar
    }
  };

  if (!visible) return null;

  return (
    <div className="no-print relative z-40 border-b border-emerald-500/30 bg-gradient-to-r from-[#0F314A] via-[#123d5a] to-[#0F314A] px-3 py-2 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2.5">
        <p className="text-[11px] font-bold leading-snug text-white sm:text-xs">
          📲 Instala <strong>PideTirúa</strong> en tu celular para pedir más
          rápido
        </p>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => void handleInstalarClick()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a] px-3.5 py-1.5 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-[#15803d] active:scale-95 sm:text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Instalar</span>
          </button>

          <button
            type="button"
            onClick={handleCerrarBanner}
            aria-label="Cerrar aviso de instalación"
            className="rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mostrarGuiaManual && (
        <div className="mx-auto mt-2 max-w-xl rounded-xl border border-white/20 bg-black/45 px-3.5 py-2.5 text-[11px] leading-relaxed text-white/95 backdrop-blur-md">
          {esIOS ? (
            <p className="flex items-center gap-1.5">
              <Share className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>
                En iPhone/iPad: toca el botón <strong>Compartir</strong> en
                Safari y selecciona{" "}
                <strong>&ldquo;Agregar a Inicio&rdquo;</strong>.
              </span>
            </p>
          ) : (
            <p>
              💡 Abre el menú de tu navegador (<strong>⋮</strong>) y selecciona{" "}
              <strong>&ldquo;Instalar aplicación&rdquo;</strong> o{" "}
              <strong>&ldquo;Agregar a la pantalla principal&rdquo;</strong>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
