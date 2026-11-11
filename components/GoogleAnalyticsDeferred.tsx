"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

interface GoogleAnalyticsDeferredProps {
  gaId: string;
}

/**
 * Carga Google Analytics (gtag.js) tras la primera interacción del usuario o en tiempo ocioso
 * posterior a la carga inicial, evitando bloquear el hilo principal durante el arranque (FCP/TBT).
 */
export default function GoogleAnalyticsDeferred({ gaId }: GoogleAnalyticsDeferredProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !gaId) return;

    // Inicializar cola de dataLayer inmediatamente para no perder eventos tempranos
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    }
    window.gtag("js", new Date());
    window.gtag("config", gaId);

    let loaded = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    const injectScript = () => {
      if (loaded) return;
      loaded = true;
      cleanup();

      if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
    };

    const cleanup = () => {
      for (const ev of events) {
        window.removeEventListener(ev, injectScript);
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    for (const ev of events) {
      window.addEventListener(ev, injectScript, { once: true, passive: true });
    }

    // Fallback de respaldo si el usuario lee sin interactuar
    fallbackTimer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
          injectScript
        );
      } else {
        injectScript();
      }
    }, 6500);

    return cleanup;
  }, [gaId]);

  return null;
}
