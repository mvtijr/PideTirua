"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  Star,
  Search,
  X,
  QrCode,
  Store,
  UtensilsCrossed,
  AlertTriangle,
  Sparkles,
  Flame,
} from "lucide-react";
import { ItemCarrito, Local, Producto, OpcionSeleccionada, EstadoPedido } from "@/types/local";
import {
  esOfertaValidaHoy,
  formatPhoneDisplay,
  getPrecioEfectivoProducto,
  getPrecioUnitarioItem,
} from "@/lib/formatters";
import { getLocalTheme, getVideoPoster } from "@/lib/localTheme";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import FloatingCartBar from "@/components/FloatingCartBar";
import dynamic from "next/dynamic";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";
import { TopDownLetters } from "@/components/ui/top-down-letters";

const CartDrawer = dynamic(() => import("@/components/CartDrawer"), {
  ssr: false,
});
const ModalPersonalizarPlato = dynamic(
  () => import("@/components/ModalPersonalizarPlato"),
  { ssr: false }
);

interface MenuClientProps {
  local: Local;
}

export default function MenuClient({ local: initialLocal }: MenuClientProps) {
  const [local, setLocal] = useState<Local>(initialLocal);
  const [notificacionRealtime, setNotificacionRealtime] = useState<{
    mensaje: string;
    tipo: "info" | "alerta" | "exito";
  } | null>(null);
  const timeoutNotifRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocal(initialLocal);
  }, [initialLocal]);

  const storageKey = `pidetirua_cart_${local.slug}`;
  const theme = getLocalTheme(local.slug);
  const bannerPrincipal = local.banner_url || local.fotoPortada;
  const bannerVideoUrl = local.banner_video_url || local.videoPortada;
  const logoPrincipal = local.logo_url || local.logo;
  const localSuspendido = local.activo === false;
  const videoDeFondo = bannerVideoUrl || local.videoFondo;
  const posterFondo = getVideoPoster(videoDeFondo, bannerPrincipal);
  const posterPortada = getVideoPoster(bannerVideoUrl, bannerPrincipal);
  const telefonoDirecto = local.telefono_whatsapp || local.telefonoWhatsapp;
  const horaApertura = (local.horario || local.horarioEntrega || "")
    .split(" a ")[0]
    ?.replace(/^.*·\s*/, "")
    .trim() || "12:00";

  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState<string>(
    local.categorias?.[0]?.id ?? ""
  );
  const [busquedaPlato, setBusquedaPlato] = useState("");
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [mostrarQr, setMostrarQr] = useState(false);
  const [platoParaPersonalizar, setPlatoParaPersonalizar] =
    useState<Producto | null>(null);
  const [itemParaEditar, setItemParaEditar] = useState<ItemCarrito | null>(null);
  const [pedidoActivo, setPedidoActivo] = useState<{
    codigoRetiro: string;
    estado: EstadoPedido;
    pedidoId?: string;
  } | null>(null);

  const mostrarNotificacion = useCallback(
    (mensaje: string, tipo: "info" | "alerta" | "exito" = "info") => {
      if (timeoutNotifRef.current) clearTimeout(timeoutNotifRef.current);
      setNotificacionRealtime({ mensaje, tipo });
      timeoutNotifRef.current = setTimeout(() => {
        setNotificacionRealtime(null);
      }, 4000);
    },
    []
  );

  const aplicarCambioDisponibilidad = useCallback(
    (productoId: string, disponible: boolean) => {
      let nombrePlato = "";
      setLocal((prev) => {
        let encontrado = false;
        const nuevasCategorias = (prev.categorias || []).map((cat) => ({
          ...cat,
          productos: (cat.productos || []).map((prod) => {
            if (prod.id === productoId) {
              encontrado = true;
              nombrePlato = prod.nombre;
              return { ...prod, disponible };
            }
            return prod;
          }),
        }));
        if (!encontrado) return prev;
        return { ...prev, categorias: nuevasCategorias };
      });

      if (nombrePlato) {
        mostrarNotificacion(
          disponible
            ? `🟢 ¡"${nombrePlato}" ya está disponible para pedir!`
            : `⏸️ "${nombrePlato}" se agotó por el momento`,
          disponible ? "exito" : "alerta"
        );
      }
    },
    [mostrarNotificacion]
  );

  const aplicarCambioCategoria = useCallback(
    (categoriaId: string, activa: boolean) => {
      let nombreCat = "";
      setLocal((prev) => {
        const nuevasCategorias = (prev.categorias || []).map((cat) => {
          if (cat.id === categoriaId) {
            nombreCat = cat.nombre;
            return {
              ...cat,
              activa,
              productos: (cat.productos || []).map((p) => ({
                ...p,
                disponible: activa,
              })),
            };
          }
          return cat;
        });
        return { ...prev, categorias: nuevasCategorias };
      });

      if (nombreCat) {
        mostrarNotificacion(
          activa
            ? `🟢 Categoría "${nombreCat}" disponible`
            : `⏸️ Categoría "${nombreCat}" pausada por hoy`,
          activa ? "exito" : "alerta"
        );
      }
    },
    [mostrarNotificacion]
  );

  const sincronizarMenuCompleto = useCallback(
    async (silencioso = true) => {
      try {
        const res = await fetch(
          `/api/menu/${initialLocal.slug}?t=${Date.now()}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.local) {
            setLocal(data.local);
            if (!silencioso) {
              mostrarNotificacion("✨ Carta sincronizada en vivo", "info");
            }
          }
        }
      } catch (err) {
        console.debug("[MenuClient] Error en sincronización:", err);
      }
    },
    [initialLocal.slug, mostrarNotificacion]
  );

  // Suscripción Realtime a cambios de disponibilidad y menú
  useEffect(() => {
    const canal = supabase
      .channel(`menu-${initialLocal.slug}`)
      .on("broadcast", { event: "producto-disponibilidad" }, (payload) => {
        const { productoId, disponible } = (payload.payload || {}) as {
          productoId?: string;
          disponible?: boolean;
        };
        if (productoId && typeof disponible === "boolean") {
          aplicarCambioDisponibilidad(productoId, disponible);
        }
      })
      .on("broadcast", { event: "categoria-disponibilidad" }, (payload) => {
        const { categoriaId, activa } = (payload.payload || {}) as {
          categoriaId?: string;
          activa?: boolean;
        };
        if (categoriaId && typeof activa === "boolean") {
          aplicarCambioCategoria(categoriaId, activa);
        }
      })
      .on("broadcast", { event: "menu-actualizado" }, () => {
        void sincronizarMenuCompleto(false);
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "productos",
        },
        (payload) => {
          const nuevo = payload.new as { id?: string; disponible?: boolean };
          if (nuevo?.id && typeof nuevo.disponible === "boolean") {
            aplicarCambioDisponibilidad(nuevo.id, nuevo.disponible);
          } else {
            void sincronizarMenuCompleto(true);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "locales",
          filter: `slug=eq.${initialLocal.slug}`,
        },
        () => {
          void sincronizarMenuCompleto(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [
    initialLocal.slug,
    aplicarCambioDisponibilidad,
    aplicarCambioCategoria,
    sincronizarMenuCompleto,
  ]);

  // Sincronización al volver a enfocar la ventana o desbloquear pantalla
  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        void sincronizarMenuCompleto(true);
      }
    };
    window.addEventListener("visibilitychange", onFocusOrVisible);
    window.addEventListener("focus", onFocusOrVisible);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void sincronizarMenuCompleto(true);
      }
    }, 45000);

    return () => {
      window.removeEventListener("visibilitychange", onFocusOrVisible);
      window.removeEventListener("focus", onFocusOrVisible);
      clearInterval(interval);
    };
  }, [sincronizarMenuCompleto]);

  // Sincronizar estado de última comanda activa para el live tracker flotante
  useEffect(() => {
    const revisarUltimoPedido = () => {
      try {
        const raw = localStorage.getItem(`pidetirua_ultimo_pedido_${local.slug}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          const fecha = parsed.fecha ? new Date(parsed.fecha).getTime() : 0;
          if (
            Date.now() - fecha < 8 * 60 * 60 * 1000 &&
            parsed.estado !== "entregado" &&
            parsed.estado !== "cancelado"
          ) {
            setPedidoActivo({
              codigoRetiro: parsed.codigoRetiro,
              estado: parsed.estado || "pendiente",
              pedidoId: parsed.pedidoId,
            });
            return;
          }
        }
        setPedidoActivo(null);
      } catch {}
    };

    revisarUltimoPedido();
    const interval = setInterval(revisarUltimoPedido, 4000);
    return () => clearInterval(interval);
  }, [local.slug, drawerAbierto]);

  // Cargar carrito persistido por local en el navegador
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(storageKey);
      if (guardado) {
        const parseado = JSON.parse(guardado) as ItemCarrito[];
        if (Array.isArray(parseado)) {
          setCarrito(parseado);
        }
      }
    } catch {
      // Ignorar errores de localStorage en modo privado
    } finally {
      setHidratado(true);
    }
  }, [storageKey]);

  // Guardar cambios del carrito por local
  useEffect(() => {
    if (!hidratado) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(carrito));
    } catch {
      // Ignorar errores de escritura
    }
  }, [carrito, hidratado, storageKey]);

  const handleAgregarProducto = useCallback(
    (producto: Producto) => {
      if (producto.disponible === false || localSuspendido) return;

      // Si el plato cuenta con modificadores o extras, abrir el modal de personalización
      if (producto.opciones && producto.opciones.length > 0) {
        setPlatoParaPersonalizar(producto);
        return;
      }

      setCarrito((prev) => {
        const existe = prev.find(
          (item) =>
            !item.opcionesSeleccionadas?.length &&
            item.producto.id === producto.id
        );
        if (existe) {
          return prev.map((item) =>
            item === existe
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          );
        }
        return [
          ...prev,
          {
            id: producto.id,
            producto,
            cantidad: 1,
            precioUnitarioFinal: getPrecioEfectivoProducto(producto),
          },
        ];
      });
    },
    [localSuspendido]
  );

  const handleEditarItem = useCallback((item: ItemCarrito) => {
    setItemParaEditar(item);
    setPlatoParaPersonalizar(item.producto);
  }, []);

  const handleConfirmarPersonalizacion = useCallback(
    (
      producto: Producto,
      opcionesSeleccionadas: OpcionSeleccionada[],
      cantidad: number
    ) => {
      if (producto.disponible === false || localSuspendido) return;

      const extrasClave = (opcionesSeleccionadas || [])
        .map((o) => `${o.grupoTitulo}:${o.nombre}`)
        .sort()
        .join("|");
      const nuevoCartItemId = `${producto.id}${
        extrasClave ? `-${extrasClave}` : ""
      }`;

      const precioBase = getPrecioEfectivoProducto(producto);
      const precioExtras = (opcionesSeleccionadas || []).reduce(
        (acc, op) => acc + (Number(op.precio) || 0),
        0
      );
      const precioUnitarioFinal = precioBase + precioExtras;

      if (itemParaEditar) {
        const targetId = itemParaEditar.id || itemParaEditar.producto.id;
        setCarrito((prev) =>
          prev.map((item) =>
            (item.id || item.producto.id) === targetId
              ? {
                  id: nuevoCartItemId,
                  producto,
                  cantidad,
                  opcionesSeleccionadas,
                  precioUnitarioFinal,
                }
              : item
          )
        );
        setItemParaEditar(null);
        setPlatoParaPersonalizar(null);
        return;
      }

      setCarrito((prev) => {
        const existe = prev.find(
          (item) => (item.id || item.producto.id) === nuevoCartItemId
        );
        if (existe) {
          return prev.map((item) =>
            (item.id || item.producto.id) === nuevoCartItemId
              ? { ...item, cantidad: item.cantidad + cantidad }
              : item
          );
        }
        return [
          ...prev,
          {
            id: nuevoCartItemId,
            producto,
            cantidad,
            opcionesSeleccionadas,
            precioUnitarioFinal,
          },
        ];
      });
      setPlatoParaPersonalizar(null);
    },
    [itemParaEditar, localSuspendido]
  );

  const handleDisminuirProducto = useCallback((itemId: string) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          (item.id || item.producto.id) === itemId
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  }, []);

  const handleIncrementarItem = useCallback((itemObj: ItemCarrito) => {
    const targetId = itemObj.id || itemObj.producto.id;
    setCarrito((prev) =>
      prev.map((item) =>
        (item.id || item.producto.id) === targetId
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  }, []);

  const handleVaciarCarrito = useCallback(() => {
    setCarrito([]);
  }, []);

  const cantidadPorProducto = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const item of carrito) {
      const prevQty = mapa.get(item.producto.id) || 0;
      mapa.set(item.producto.id, prevQty + item.cantidad);
    }
    return mapa;
  }, [carrito]);

  const totalUnidades = useMemo(
    () => carrito.reduce((acc, item) => acc + item.cantidad, 0),
    [carrito]
  );

  const subtotal = useMemo(
    () =>
      carrito.reduce(
        (acc, item) => acc + getPrecioUnitarioItem(item) * item.cantidad,
        0
      ),
    [carrito]
  );

  const ofertasDelDiaLocal = useMemo(() => {
    const listado: Producto[] = [];
    local.categorias.forEach((cat) => {
      cat.productos.forEach((p) => {
        if (esOfertaValidaHoy(p)) {
          listado.push(p);
        }
      });
    });
    return listado;
  }, [local.categorias]);

  const categoriasFiltradas = useMemo(() => {
    const query = busquedaPlato.trim().toLowerCase();
    if (!query) return local.categorias;

    return local.categorias
      .map((cat) => ({
        ...cat,
        productos: cat.productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(query) ||
            p.descripcion.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.productos.length > 0);
  }, [local.categorias, busquedaPlato]);

  const irACategoria = (categoriaId: string) => {
    setCategoriaActiva(categoriaId);
    const elemento = document.getElementById(`seccion-${categoriaId}`);
    if (elemento) {
      const yOffset = -130;
      const y =
        elemento.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className={`relative min-h-screen pb-28 ${theme.pageBg} overflow-hidden`}>
      {/* Notificación flotante de sincronización en tiempo real */}
      {notificacionRealtime && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm sm:max-w-md w-auto px-4"
        >
          <div
            className={`flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-bold shadow-2xl backdrop-blur-md border ${
              notificacionRealtime.tipo === "exito"
                ? "bg-emerald-950/90 text-emerald-100 border-emerald-500/50 shadow-emerald-950/40"
                : notificacionRealtime.tipo === "alerta"
                ? "bg-amber-950/90 text-amber-100 border-amber-500/50 shadow-amber-950/40"
                : "bg-stone-900/90 text-white border-stone-700/60 shadow-black/40"
            }`}
          >
            <span className="flex h-2 w-2 rounded-full bg-current animate-ping" />
            <span>{notificacionRealtime.mensaje}</span>
          </div>
        </div>
      )}

      {/* Fondo degradado ambiental con textura de ruido estática (Zero GPU loop) */}
      <GradientBackground
        gradientType="radial-gradient"
        gradientOrigin="top-middle"
        gradientSize="140% 110%"
        colors={[
          { color: "rgba(254, 240, 218, 0.4)", stop: "0%" },
          { color: "rgba(250, 248, 245, 0.75)", stop: "40%" },
          { color: "rgba(250, 248, 245, 1)", stop: "100%" },
        ]}
        noiseIntensity={0.5}
        noisePatternAlpha={28}
        noisePatternSize={85}
        noisePatternRefreshInterval={0}
      />

      {/* Video de fondo fijo a pantalla completa detrás de toda la carta digital (encuadre alejado y completo) */}
      {videoDeFondo && (
        <div
          className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${theme.pageBg}`}
        >
          {/* Capa ambiental difuminada con imagen ultraligera para rellenar bordes sin duplicar el video */}
          <img
            src={posterFondo}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="h-full w-full object-cover blur-xl opacity-45"
          />
          {/* Video principal alejado (object-contain) para que se vea completo de extremo a extremo */}
          <video
            src={videoDeFondo}
            poster={posterFondo}
            preload="none"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            className="pointer-events-none select-none absolute inset-0 h-full w-full object-contain blur-[2px]"
          />
          <div
            className={`absolute inset-0 bg-gradient-to-b ${theme.videoOverlayGradient}`}
          />
        </div>
      )}

      {/* Contenedor Mobile-First en celular y Widescreen Editorial en PC */}
      <div
        className={`relative z-10 mx-auto w-full max-w-xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl min-h-screen md:min-h-0 md:my-6 md:rounded-3xl md:shadow-2xl md:border md:border-stone-200/90 ${theme.containerBg}`}
      >
        {/* Portada e Identidad del Local */}
        <header className="relative">
          <div
            className={`relative w-full overflow-hidden md:rounded-t-3xl h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 ${theme.headerBg}`}
          >
            {bannerVideoUrl ? (
              <video
                key={bannerVideoUrl}
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
                poster={local.banner_url || posterPortada || undefined}
                className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
              >
                <source src={bannerVideoUrl} type="video/mp4" />
                <source src={bannerVideoUrl} type="video/webm" />
              </video>
            ) : (
              <img
                src={bannerPrincipal}
                alt={local.nombre}
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Capa de contraste semitransparente y degradado para lectura nítida */}
            <div className="absolute inset-0 bg-black/40" />
            <div
              className={`absolute inset-0 bg-gradient-to-t ${theme.headerGradient}`}
            />

            {/* Barra superior de navegación */}
            <div className="absolute left-3.5 right-3.5 top-3.5 sm:left-6 sm:right-6 sm:top-5 flex items-center justify-between">
              <Link
                href="/"
                className={`inline-flex items-center gap-2 rounded-full pl-2.5 pr-4 py-2 text-xs font-bold backdrop-blur-md transition shadow-md hover:scale-105 active:scale-95 ${theme.backBtn}`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <img
                  src="/logo-pidetirua.jpg"
                  alt="Logo PideTirúa"
                  className="h-6 w-6 rounded-full object-contain bg-white ring-1 ring-stone-200"
                />
                <span>PideTirúa</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarQr(true)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold shadow-md backdrop-blur-md transition hover:scale-105 active:scale-95 ${theme.qrBtn}`}
                  aria-label="Mostrar código QR del local"
                >
                  <QrCode className={`h-3.5 w-3.5 ${theme.qrIcon}`} />
                  <span>QR Mesa</span>
                </button>
              </div>
            </div>

            {/* Logo y título sobre la portada */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 md:bottom-8 md:left-8 md:right-8 flex items-end gap-3.5 sm:gap-5">
              <div
                className={`h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 shrink-0 overflow-hidden shadow-2xl rounded-2xl ring-2 sm:ring-4 ring-white/20 ${theme.logoBox}`}
              >
                <img
                  src={logoPrincipal}
                  alt={`Logo ${local.nombre}`}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-white">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-bold shadow-sm backdrop-blur-md border ${
                      localSuspendido
                        ? "bg-rose-700/95 text-white border-rose-400/50"
                        : local.abierto
                        ? "bg-emerald-600/95 text-white border-emerald-400/40"
                        : "bg-rose-600/95 text-white border-rose-400/40"
                    }`}
                  >
                    {localSuspendido
                      ? "⛔ Servicio Suspendido"
                      : local.abierto
                      ? `🟢 Abierto • ${local.horario}`
                      : `🔴 Cerrado • Abre hoy a las ${horaApertura} hrs`}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-bold text-[#F8DC4B]">
                    <Star className="h-3 w-3 fill-[#F8DC4B] text-[#F8DC4B]" />
                    {(Number(local.calificacion) || 5.0).toFixed(1)}
                  </span>
                </div>
                <h1 className="mt-1 truncate font-display tracking-wide uppercase text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight drop-shadow-md">
                  {local.nombre}
                </h1>
                <p className={`truncate text-xs sm:text-sm font-bold uppercase tracking-wider ${theme.rubroText}`}>
                  {local.rubro}
                </p>
              </div>
            </div>
          </div>

          {localSuspendido && (
            <div className="border-b border-rose-500/40 bg-rose-950/90 px-4 py-3.5 text-xs font-bold text-rose-100">
              ⛔ <strong>Servicio Temporalmente Suspendido:</strong> Este local
              no se encuentra recibiendo pedidos digitales en este momento.
            </div>
          )}

          {/* Ficha informativa del Local */}
          <div className={`border-b px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 ${theme.infoSectionBg}`}>
            {/* Cabecera compacta con Estado, Ubicación y Botón de Llamada */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      localSuspendido
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : local.abierto
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {localSuspendido
                      ? "⛔ Servicio Suspendido"
                      : local.abierto
                      ? `🟢 Abierto • ${local.horario}`
                      : `🔴 Cerrado • Abre hoy a las ${horaApertura} hrs`}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs font-bold text-stone-700">
                    <MapPin className="h-3 w-3 text-[#C2410C]" />
                    {local.ubicacion}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span>Tiempo est.: {local.tiempo_estimado || local.tiempoEstimado || "20-30 min"}</span>
                  </span>
                </div>
                <p className={`mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm ${theme.infoSub}`}>
                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${theme.infoIcon}`} />
                  <span className="truncate">{local.direccionDetalle}</span>
                </p>
              </div>

              {telefonoDirecto && (
                <a
                  href={`tel:+${telefonoDirecto}`}
                  className={`inline-flex shrink-0 items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-sm rounded-full transition active:scale-95 hover:scale-105 ${theme.callBtn}`}
                >
                  <Phone className={`h-3.5 w-3.5 ${theme.callIcon}`} />
                  <span>Llamar al local</span>
                </a>
              )}
            </div>

            <p
              className={`text-xs leading-relaxed sm:text-sm md:text-base max-w-4xl ${theme.infoDescText}`}
            >
              {local.descripcionCorta}
            </p>

            <div
              className={`mt-3.5 grid grid-cols-1 gap-3 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm sm:grid-cols-2 lg:grid-cols-3 ${theme.infoGridBox}`}
            >
              <div className="flex items-start gap-2.5">
                <MapPin
                  className={`mt-0.5 h-4 w-4 shrink-0 ${theme.infoIcon}`}
                />
                <div>
                  <span className={`font-bold ${theme.infoTitle}`}>
                    {local.ubicacion}
                  </span>
                  <p className={`text-[11px] sm:text-xs ${theme.infoSub}`}>
                    {local.direccionDetalle}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock
                  className={`mt-0.5 h-4 w-4 shrink-0 ${theme.infoIcon}`}
                />
                <div>
                  <span className={`font-bold ${theme.infoTitle}`}>
                    Horario: {local.horario}
                  </span>
                  <p className={`text-[11px] sm:text-xs ${theme.infoSub}`}>
                    Preparación est.: {local.tiempo_estimado || local.tiempoEstimado || "20-30 min"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:col-span-2 lg:col-span-1">
                <Store
                  className={`mt-0.5 h-4 w-4 shrink-0 ${theme.infoIcon}`}
                />
                <div>
                  <span className={`font-bold ${theme.infoTitle}`}>
                    Modalidades de Pedido
                  </span>
                  <p className={`text-[11px] sm:text-xs ${theme.infoSub}`}>
                    Retiro al paso o servirse en mesa (sin delivery) • WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {/* Modalidades de atención exclusivas: Retiro al paso o Servir en local */}
            <div className="mt-3.5 flex items-center justify-between gap-3">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${theme.modalityBadge}`}
              >
                <Store className={`h-4 w-4 ${theme.modalityIcon}`} />
                <span>🛍️ Retiro al paso en mostrador • 🍽️ Servirse en local</span>
              </div>
            </div>
          </div>
        </header>

        {/* Banner de Aviso de Emergencia o Contingencia en Vivo */}
        {local.mensaje_emergencia && local.mensaje_emergencia.trim() && (
          <div className="px-4 sm:px-6 md:px-8 mt-3 sm:mt-4">
            <div
              role="alert"
              className="relative overflow-hidden rounded-2xl border-2 border-amber-500 bg-amber-50/95 p-4 text-amber-950 shadow-md backdrop-blur-xs animate-in fade-in duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block rounded-md bg-amber-200/90 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-950">
                    Aviso del Local en Vivo
                  </span>
                  <p className="mt-1 font-body text-xs sm:text-sm font-bold leading-snug text-amber-950">
                    {local.mensaje_emergencia}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner Decorativo Editorial de la Carta con Grano Estático */}
        <div className="px-4 sm:px-6 md:px-8 my-3 sm:my-4">
          <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 p-3.5 sm:p-4 shadow-xs">
            <GradientBackground
              gradientType="linear-gradient"
              gradientOrigin="left-middle"
              colors={[
                { color: "rgba(255, 237, 213, 0.75)", stop: "0%" },
                { color: "rgba(254, 243, 199, 0.55)", stop: "50%" },
                { color: "rgba(255, 255, 255, 0.9)", stop: "100%" },
              ]}
              noiseIntensity={0.5}
              noisePatternAlpha={28}
              noisePatternSize={80}
              noisePatternRefreshInterval={0}
            />
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EA580C] text-white shrink-0 shadow-sm">
                  <Store className="h-4 w-4" />
                </span>
                <div>
                  <span className="block font-display text-xs sm:text-sm uppercase tracking-wider text-stone-900 leading-none">
                    Carta Digital Oficial • {local.nombre}
                  </span>
                  <span className="block text-[11px] sm:text-xs font-semibold text-stone-600 mt-0.5">
                    🛍️ Retiro al paso • 🍽️ Servirse en local (sin delivery)
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-700 shadow-2xs border border-stone-200 shrink-0">
                Directo WhatsApp
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas Sticky de Categorías + Buscador de Platos */}
        <div
          className={`sticky top-0 z-30 border-b backdrop-blur-md ${theme.stickyBar}`}
        >
          {/* Pestañas de categorías */}
          <nav
            aria-label="Categorías del menú"
            className="flex items-center gap-2 overflow-x-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 no-scrollbar"
          >
            {ofertasDelDiaLocal.length > 0 && (
              <button
                type="button"
                onClick={() => irACategoria("ofertas-dia")}
                className={`filter-chip shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-black transition-all rounded-full ${
                  categoriaActiva === "ofertas-dia"
                    ? "bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-orange-500/20"
                    : "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                }`}
              >
                <Flame className="h-3.5 w-3.5 fill-red-600 text-red-600" />
                <span>Ofertas de Hoy</span>
                <span className="rounded-full bg-white/90 px-1.5 py-0.2 text-[10px] font-black text-amber-950">
                  {ofertasDelDiaLocal.length}
                </span>
              </button>
            )}

            {local.categorias.map((categoria) => {
              const activa = categoriaActiva === categoria.id;
              const pausada = categoria.activa === false;
              return (
                <button
                  key={categoria.id}
                  type="button"
                  aria-current={activa ? "true" : undefined}
                  onClick={() => irACategoria(categoria.id)}
                  className={`filter-chip shrink-0 px-4 py-1.5 text-xs sm:text-sm font-bold transition-all rounded-full ${
                    activa ? theme.tabActive : theme.tabInactive
                  } ${pausada ? "opacity-60" : ""}`}
                >
                  {categoria.nombre}
                  {pausada ? " (Pausada)" : ""}
                </button>
              );
            })}
          </nav>

          {/* Buscador rápido dentro de la carta */}
          <div className="px-4 sm:px-6 md:px-8 pb-2.5 sm:pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={busquedaPlato}
                onChange={(e) => setBusquedaPlato(e.target.value)}
                placeholder={`Buscar en la carta de ${local.nombre}...`}
                aria-label={`Buscar platos en la carta de ${local.nombre}`}
                className={`w-full border py-2.5 sm:py-3 pl-10 pr-9 text-xs sm:text-sm rounded-xl focus:outline-none transition ${theme.searchInput}`}
              />
              {busquedaPlato && (
                <button
                  type="button"
                  onClick={() => setBusquedaPlato("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 p-0.5"
                  aria-label="Limpiar filtro"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Listado de Categorías y Tarjetas de Producto */}
        <main className="space-y-8 px-4 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8">
          {/* SECCIÓN DESTACADA: OFERTAS DEL DÍA DEL LOCAL */}
          {ofertasDelDiaLocal.length > 0 && !busquedaPlato && (
            <section
              id="seccion-ofertas-dia"
              className="scroll-mt-36 rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-rose-50/80 p-4 sm:p-6 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-xs">
                    <Flame className="h-5 w-5 fill-white text-white" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <TopDownLetters
                        as="h2"
                        text="Ofertas del Día"
                        className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wide text-amber-950"
                      />
                      <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                        Solo por hoy
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-900/80">
                      Precios rebajados y promociones exclusivas para hoy en {local.nombre}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-black uppercase text-amber-900">
                  {ofertasDelDiaLocal.length}{" "}
                  {ofertasDelDiaLocal.length === 1 ? "promo activa" : "promos activas"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
                {ofertasDelDiaLocal.map((producto) => (
                  <ProductCard
                    key={`oferta-top-${producto.id}`}
                    producto={producto}
                    cantidadEnCarrito={
                      cantidadPorProducto.get(producto.id) ?? 0
                    }
                    onAgregar={handleAgregarProducto}
                    onPersonalizar={(p) => setPlatoParaPersonalizar(p)}
                    onDisminuir={handleDisminuirProducto}
                    localSlug={local.slug}
                  />
                ))}
              </div>
            </section>
          )}

          {categoriasFiltradas.length > 0 ? (
            categoriasFiltradas.map((categoria) => {
              const pausada = categoria.activa === false;
              return (
                <section
                  key={categoria.id}
                  id={`seccion-${categoria.id}`}
                  className="scroll-mt-32"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TopDownLetters
                        as="h2"
                        text={categoria.nombre}
                        className={`font-display text-2xl sm:text-3xl tracking-wide uppercase ${
                          pausada
                            ? "text-stone-400 line-through decoration-stone-400"
                            : theme.categoryTitle
                        }`}
                      />
                      {pausada && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 border border-slate-300 px-2 py-0.5 text-[11px] font-black uppercase text-slate-700">
                          ⏸️ Pausada por hoy
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.categoryCount}`}
                    >
                      {categoria.productos.length}{" "}
                      {categoria.productos.length === 1 ? "opción" : "opciones"}
                    </span>
                  </div>

                  {pausada && (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-100/90 p-3 text-xs font-semibold text-slate-600">
                      ⏸️ Esta sección se encuentra pausada por hoy por reposición de stock.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
                    {categoria.productos.map((producto) => {
                      const prodEfectivo = pausada
                        ? { ...producto, disponible: false }
                        : producto;
                      return (
                        <ProductCard
                          key={producto.id}
                          producto={prodEfectivo}
                          cantidadEnCarrito={
                            cantidadPorProducto.get(producto.id) ?? 0
                          }
                          onAgregar={handleAgregarProducto}
                          onPersonalizar={setPlatoParaPersonalizar}
                          onDisminuir={handleDisminuirProducto}
                          localSlug={local.slug}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })
          ) : (
            <div
              className={`rounded-2xl border border-dashed p-8 text-center ${theme.emptyStateBox}`}
            >
              <UtensilsCrossed
                className={`mx-auto h-8 w-8 ${theme.emptyStateIcon}`}
              />
              <p className={`mt-2 text-sm font-bold ${theme.emptyStateText}`}>
                No encontramos platos con &ldquo;{busquedaPlato}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setBusquedaPlato("")}
                className={`mt-3 text-xs font-bold underline ${theme.emptyStateBtn}`}
              >
                Mostrar toda la carta
              </button>
            </div>
          )}
        </main>

        {/* Pie del menú exclusivo */}
        <footer
          className={`border-t md:rounded-b-3xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 text-center text-xs ${theme.footerBg}`}
        >
          <p className={`font-bold ${theme.footerTitle}`}>{local.nombre}</p>
          <p className="mt-0.5">
            {local.direccionDetalle} · WhatsApp{" "}
            {formatPhoneDisplay(local.telefonoWhatsapp)}
          </p>
          <div
            className={`mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] ${theme.footerSub}`}
          >
            <img
              src="/logo-pidetirua.jpg"
              alt="Logo PideTirúa"
              className="h-6 w-6 rounded-full object-contain border border-outline-variant/40 bg-white"
            />
            <span>
              Menú digital interactivo impulsado por{" "}
              <Link
                href="/"
                className={`font-bold hover:underline ${theme.footerLink}`}
              >
                PideTirúa
              </Link>
            </span>
            <span>·</span>
            <Link
              href={`/admin/${local.slug}`}
              className={`font-semibold opacity-80 hover:opacity-100 hover:underline ${theme.footerLink}`}
            >
              Panel Admin Local
            </Link>
          </div>
        </footer>
      </div>



      {/* Píldora Flotante de Estado en Vivo (Live Tracker) */}
      {pedidoActivo && !drawerAbierto && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed right-4 left-4 sm:left-auto sm:right-6 sm:w-80 md:w-96 z-30 transition-all duration-300 animate-in slide-in-from-bottom ${
            totalUnidades > 0 ? "bottom-24 sm:bottom-28" : "bottom-4 sm:bottom-6 safe-bottom"
          }`}
        >
          <button
            type="button"
            onClick={() => setDrawerAbierto(true)}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white/95 backdrop-blur-md p-3 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-base ${
                  pedidoActivo.estado === "listo"
                    ? "bg-emerald-500 text-white animate-pulse"
                    : pedidoActivo.estado === "preparando"
                    ? "bg-orange-500 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {pedidoActivo.estado === "listo"
                  ? "🎉"
                  : pedidoActivo.estado === "preparando"
                  ? "🔥"
                  : "⏳"}
              </span>
              <div>
                <span className="block text-xs font-black text-stone-900 leading-tight">
                  {pedidoActivo.estado === "listo"
                    ? "¡Tu comida está lista para retirar!"
                    : pedidoActivo.estado === "preparando"
                    ? "En cocina preparando..."
                    : "Comanda en preparación"}
                </span>
                <span className="block text-[11px] font-bold text-[#C2410C] tabular-nums mt-0.5">
                  #{pedidoActivo.codigoRetiro} • Toca para ver recibo
                </span>
              </div>
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-stone-700">
              Ver ➔
            </span>
          </button>
        </aside>
      )}

      {/* Carrito flotante inferior */}
      <FloatingCartBar
        totalUnidades={totalUnidades}
        subtotal={subtotal}
        onOpenDrawer={() => setDrawerAbierto(true)}
        localSlug={local.slug}
      />

      {/* Drawer lateral de Checkout a WhatsApp */}
      <CartDrawer
        abierto={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        local={local}
        items={carrito}
        onAgregar={handleAgregarProducto}
        onIncrementarItem={handleIncrementarItem}
        onDisminuir={handleDisminuirProducto}
        onEditarItem={handleEditarItem}
        onVaciar={handleVaciarCarrito}
      />

      {/* Modal de Personalización / Edición de Plato */}
      <ModalPersonalizarPlato
        isOpen={Boolean(platoParaPersonalizar)}
        onClose={() => {
          setPlatoParaPersonalizar(null);
          setItemParaEditar(null);
        }}
        producto={platoParaPersonalizar}
        localSlug={local.slug}
        opcionesIniciales={itemParaEditar?.opcionesSeleccionadas}
        cantidadInicial={itemParaEditar?.cantidad}
        modoEdicion={Boolean(itemParaEditar)}
        onConfirmar={handleConfirmarPersonalizacion}
      />

      {/* Modal de Código QR del Local */}
      {mostrarQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setMostrarQr(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-surface-container-lowest p-5 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${theme.qrModalAccent}`}
              >
                Código QR de Carta
              </span>
              <button
                type="button"
                onClick={() => setMostrarQr(false)}
                className="rounded-full p-1 text-outline hover:bg-surface-container-low"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className={`mt-1 text-base font-extrabold ${theme.qrModalTitle}`}>
              {local.nombre}
            </h3>
            <div className="my-4 flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `https://pidetirua.cl/${local.slug}`
                )}`}
                alt={`QR ${local.nombre}`}
                className="h-40 w-40 rounded-xl border border-outline-variant/40 bg-white p-2"
              />
            </div>
            <p className="text-xs text-on-surface-variant">
              Comparte o escanea este código QR para abrir la carta digital en
              cualquier celular.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
