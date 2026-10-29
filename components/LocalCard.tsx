"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star, QrCode, Clock, MapPin, ArrowRight, MessageCircle } from "lucide-react";
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

  const bannerSrc = local.banner_url || local.fotoPortada;
  const logoSrc = local.logo_url || local.logo;
  const videoSrc =
    local.banner_video_url || local.videoFondo || local.videoPortada;
  const posterSrc = getVideoPoster(videoSrc, bannerSrc);

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
      className="content-auto group flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-300/80"
    >
      {/* Imagen o Video & Badges Flotantes */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-900">
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
                controls={false}
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                disableRemotePlayback
                tabIndex={-1}
                className="pointer-events-none select-none relative z-10 w-full h-full object-contain"
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
            src={bannerSrc}
            alt={`Portada de ${local.nombre}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/20"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  local.abierto ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span>{local.abierto ? "Abierto" : "Cerrado"}</span>
            </span>

            <span className="rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-900 shadow-xs">
              {local.ubicacion}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-white/20">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {local.calificacion.toFixed(1)}
            </span>
            {onOpenQr && (
              <button
                type="button"
                onClick={() => onOpenQr(local)}
                title={`Ver código QR de ${local.nombre}`}
                aria-label={`Ver código QR de ${local.nombre}`}
                className="inline-flex min-h-[40px] min-w-[40px] h-10 w-10 sm:h-9 sm:w-9 sm:min-h-[36px] sm:min-w-[36px] items-center justify-center rounded-full bg-white text-stone-900 shadow-md transition hover:bg-stone-100 active:scale-95"
              >
                <QrCode className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 z-30 flex items-center justify-between text-white">
          <span className="text-[11px] font-semibold bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
            <Clock className="h-3 w-3" />
            {local.tiempoEstimado}
          </span>
          <span className="text-[11px] font-bold bg-[#EA580C]/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white">
            {totalProductos} platos
          </span>
        </div>
      </div>

      {/* Contenido del Comercio */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <img
              src={logoSrc}
              alt={`Logo ${local.nombre}`}
              className="w-10 h-10 rounded-full object-cover border border-stone-200 shadow-sm bg-white p-0.5 flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#EA580C] block truncate">
                {local.rubro}
              </span>
              <span className="text-[11px] font-medium text-stone-500 block truncate">
                {local.horario || local.horarioEntrega}
              </span>
            </div>
          </div>

          <h3 className="font-display text-2xl font-bold tracking-wide text-stone-900 group-hover:text-[#EA580C] transition-colors line-clamp-1">
            {local.nombre}
          </h3>
          <p className="font-body text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
            {local.descripcionCorta}
          </p>
        </div>

        {/* Micro Metadatos y Pedido Directo */}
        <div className="space-y-2 pt-1 border-t border-stone-100">
          <div className="flex items-center gap-1.5 font-body text-xs text-stone-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#EA580C]" />
            <span className="truncate">{local.direccionDetalle}</span>
          </div>

          {/* Botones de Acción Estilo Píldora */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href={`/${local.slug}`}
              className="min-h-[44px] bg-stone-100 hover:bg-[#18181B] hover:text-white text-stone-900 font-body text-xs font-bold uppercase tracking-wider py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Ver Carta</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href={`https://wa.me/${(
                local.telefonoWhatsapp ||
                local.telefono_whatsapp ||
                ""
              ).replace(/\D/g, "")}?text=${encodeURIComponent(
                `Hola ${local.nombre}, quisiera pedir desde PideTirúa`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] bg-[#25D366] hover:bg-[#20bd5a] text-white font-body text-xs font-bold uppercase tracking-wider py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <MessageCircle className="h-3.5 w-3.5 fill-white text-white" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
