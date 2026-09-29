"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Local } from "@/types/local";
import { getVideoPoster } from "@/lib/localTheme";

interface LocalCardProps {
  local: Local;
  onOpenQr?: (local: Local) => void;
}

export default function LocalCard({ local, onOpenQr }: LocalCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const [enPantalla, setEnPantalla] = useState(false);

  const totalProductos = local.categorias.reduce(
    (acc, cat) => acc + cat.productos.length,
    0
  );

  const videoSrc = local.videoFondo || local.videoPortada;
  const posterSrc = getVideoPoster(videoSrc, local.fotoPortada);

  // Cargar el video de las tarjetas inferiores solo cuando el usuario se acerca haciendo scroll,
  // liberando todo el ancho de banda inicial para el carrusel 3D superior.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !videoSrc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setEnPantalla(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [videoSrc]);

  return (
    <article
      ref={cardRef}
      id={`local-${local.slug}`}
      className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group"
    >
      {/* Imagen o Video & Badges Flotantes */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#171614]">
        {videoSrc ? (
          <>
            <img
              src={posterSrc}
              alt=""
              aria-hidden="true"
              decoding="async"
              loading="lazy"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover blur-md opacity-50"
            />
            {enPantalla ? (
              <video
                src={videoSrc}
                poster={posterSrc}
                preload="metadata"
                autoPlay
                loop
                muted
                playsInline
                className="relative z-10 w-full h-full object-contain"
              />
            ) : (
              <img
                src={posterSrc}
                alt={`Portada de ${local.nombre}`}
                loading="lazy"
                decoding="async"
                className="relative z-10 w-full h-full object-contain"
              />
            )}
          </>
        ) : (
          <img
            src={local.fotoPortada}
            alt={`Portada de ${local.nombre}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-primary/70 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-space-sm left-space-sm right-space-sm z-30 flex items-center justify-between gap-1">
          <div className="flex flex-wrap items-center gap-1">
            <span
              className={`${
                local.sector === "Quidico"
                  ? "bg-secondary text-on-secondary"
                  : "bg-primary text-on-primary"
              } font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-bold`}
            >
              {local.ubicacion}
            </span>
            <span className="bg-green-600 text-white font-label-sm text-label-sm px-space-sm py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              {local.abierto ? "Abierto ahora" : "Cerrado"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold text-amber-300 backdrop-blur-md">
              <span
                className="material-symbols-outlined text-xs text-amber-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {local.calificacion.toFixed(1)}
            </span>
            {onOpenQr && (
              <button
                type="button"
                onClick={() => onOpenQr(local)}
                title={`Ver código QR de ${local.nombre}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-lowest/90 text-primary shadow transition hover:bg-white"
              >
                <span className="material-symbols-outlined text-sm">
                  qr_code_2
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="absolute bottom-space-sm left-space-sm right-space-sm z-30 flex items-center justify-between text-white">
          <span className="font-label-sm text-label-sm bg-black/40 backdrop-blur-md px-space-sm py-0.5 rounded-md flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">schedule</span>
            {local.tiempoEstimado}
          </span>
          <span
            className={`font-label-sm text-label-sm font-bold px-space-sm py-0.5 rounded-md ${
              local.sector === "Quidico"
                ? "bg-surface-container-lowest text-primary"
                : "bg-tertiary-container text-on-tertiary"
            }`}
          >
            {totalProductos} platos en carta
          </span>
        </div>
      </div>

      {/* Contenido del Comercio */}
      <div className="p-space-md flex-1 flex flex-col justify-between space-y-space-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <img
              src={local.logo}
              alt={`Logo ${local.nombre}`}
              className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 shadow-sm bg-white p-0.5 flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <span className="font-label-sm text-label-sm uppercase font-bold text-secondary block truncate">
                {local.rubro}
              </span>
              <span className="text-[11px] text-outline block">
                {local.horarioEntrega}
              </span>
            </div>
          </div>

          <h3 className="font-headline-sm text-headline-sm text-primary font-bold mt-1 group-hover:text-secondary transition-colors">
            {local.nombre}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">
            {local.descripcionCorta}
          </p>
        </div>

        {/* Micro Metadatos y Pedido Directo */}
        <div className="space-y-space-xs pt-space-xs">
          <div className="flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-sm text-outline">
              location_on
            </span>
            <span className="truncate">{local.direccionDetalle}</span>
          </div>

          {/* Botones de Acción */}
          <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
            <Link
              href={`/${local.slug}`}
              className="bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-bold py-space-xs px-space-sm rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                restaurant_menu
              </span>
              <span>Ver Carta</span>
            </Link>
            <a
              href={`https://wa.me/${
                local.telefonoWhatsapp
              }?text=${encodeURIComponent(
                `Hola ${local.nombre}, quisiera pedir desde PideTirúa`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-label-md text-label-md font-bold py-space-xs px-space-sm rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
