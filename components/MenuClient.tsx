"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
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
} from "lucide-react";
import { ItemCarrito, Local, Producto, OpcionSeleccionada, EstadoPedido } from "@/types/local";
import {
  formatPhoneDisplay,
  getPrecioEfectivoProducto,
  getPrecioUnitarioItem,
} from "@/lib/formatters";
import { getLocalTheme, getVideoPoster } from "@/lib/localTheme";
import ProductCard from "@/components/ProductCard";
import FloatingCartBar from "@/components/FloatingCartBar";
import CartDrawer from "@/components/CartDrawer";
import ModalPersonalizarPlato from "@/components/ModalPersonalizarPlato";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";

interface MenuClientProps {
  local: Local;
}

export default function MenuClient({ local }: MenuClientProps) {
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
  const horaApertura = (local.horario || local.horarioEntrega)
    .split(" a ")[0]
    ?.replace(/^.*·\s*/, "")
    .trim();

  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState<string>(
    local.categorias[0]?.id ?? ""
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

      {/* Contenedor Mobile-First (optimizado para lectura QR en celular) con acabado translúcido */}
      <div
        className={`relative z-10 mx-auto max-w-xl min-h-screen ${theme.containerBg}`}
      >
        {/* Portada e Identidad del Local */}
        <header className="relative">
          <div
            className={`relative w-full overflow-hidden h-56 sm:h-64 ${theme.headerBg}`}
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
            <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
              <Link
                href="/"
                className={`inline-flex items-center gap-2 rounded-full pl-2 pr-3.5 py-1.5 text-xs font-bold backdrop-blur-md transition ${theme.backBtn}`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <img
                  src="/logo-pidetirua.jpg"
                  alt="Logo PideTirúa"
                  className="h-6 w-6 rounded-full object-contain bg-white"
                />
                <span>PideTirúa</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarQr(true)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shadow backdrop-blur-md transition ${theme.qrBtn}`}
                  aria-label="Mostrar código QR del local"
                >
                  <QrCode className={`h-3.5 w-3.5 ${theme.qrIcon}`} />
                  <span>QR Mesa</span>
                </button>
              </div>
            </div>

            {/* Logo y título sobre la portada */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3.5">
              <div
                className={`h-16 w-16 shrink-0 overflow-hidden shadow-lg sm:h-20 sm:w-20 ${theme.logoBox}`}
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
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm backdrop-blur-md border ${
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-[#F8DC4B]">
                    <Star className="h-3 w-3 fill-[#F8DC4B] text-[#F8DC4B]" />
                    {local.calificacion.toFixed(1)}
                  </span>
                </div>
                <h1 className="mt-1 truncate font-display tracking-wide uppercase text-2xl sm:text-3xl leading-tight">
                  {local.nombre}
                </h1>
                <p className={`truncate text-xs font-bold uppercase tracking-wider ${theme.rubroText}`}>
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
          <div className={`border-b px-4 py-4 ${theme.infoSectionBg}`}>
            {/* Cabecera compacta con Estado, Ubicación y Botón de Llamada */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
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
                    <MapPin className="h-3 w-3 text-[#EA580C]" />
                    {local.ubicacion}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span>Tiempo est.: {local.tiempo_estimado || local.tiempoEstimado || "20-30 min"}</span>
                  </span>
                </div>
                <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${theme.infoSub}`}>
                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${theme.infoIcon}`} />
                  <span className="truncate">{local.direccionDetalle}</span>
                </p>
              </div>

              {telefonoDirecto && (
                <a
                  href={`tel:+${telefonoDirecto}`}
                  className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 ${theme.callBtn}`}
                >
                  <Phone className={`h-3.5 w-3.5 ${theme.callIcon}`} />
                  <span>Llamar al local</span>
                </a>
              )}
            </div>

            <p
              className={`text-xs leading-relaxed sm:text-sm ${theme.infoDescText}`}
            >
              {local.descripcionCorta}
            </p>

            <div
              className={`mt-3.5 grid grid-cols-1 gap-2 rounded-2xl p-3 text-xs sm:grid-cols-2 ${theme.infoGridBox}`}
            >
              <div className="flex items-start gap-2">
                <MapPin
                  className={`mt-0.5 h-4 w-4 shrink-0 ${theme.infoIcon}`}
                />
                <div>
                  <span className={`font-bold ${theme.infoTitle}`}>
                    {local.ubicacion}
                  </span>
                  <p className={`text-[11px] ${theme.infoSub}`}>
                    {local.direccionDetalle}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock
                  className={`mt-0.5 h-4 w-4 shrink-0 ${theme.infoIcon}`}
                />
                <div>
                  <span className={`font-bold ${theme.infoTitle}`}>
                    Horario: {local.horario}
                  </span>
                  <p className={`text-[11px] ${theme.infoSub}`}>
                    Preparación est.: {local.tiempo_estimado || local.tiempoEstimado || "20-30 min"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modalidades de atención exclusivas: Retiro en local y Consumo en mesa */}
            <div className="mt-3.5 flex items-center justify-between gap-3">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${theme.modalityBadge}`}
              >
                <Store className={`h-4 w-4 ${theme.modalityIcon}`} />
                <span>Retiro en local y Consumo en mesa</span>
              </div>
            </div>
          </div>
        </header>

        {/* Banner de Aviso de Emergencia o Contingencia en Vivo */}
        {local.mensaje_emergencia && local.mensaje_emergencia.trim() && (
          <div className="px-4 mt-3">
            <div
              role="alert"
              className="relative overflow-hidden rounded-2xl border-2 border-amber-500 bg-amber-50/95 p-4 text-amber-950 shadow-md backdrop-blur-xs animate-in fade-in duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block rounded-md bg-amber-200/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-950">
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
        <div className="px-4 my-3">
          <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 p-3 shadow-xs">
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
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EA580C] text-white shrink-0">
                  <Store className="h-3.5 w-3.5" />
                </span>
                <div>
                  <span className="block font-display text-xs uppercase tracking-wider text-stone-900 leading-none">
                    Carta Digital Oficial • {local.nombre}
                  </span>
                  <span className="block text-[10px] font-semibold text-stone-600 mt-0.5">
                    Retiro en local y consumo en mesa
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-700 shadow-2xs border border-stone-200 shrink-0">
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
            className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 no-scrollbar"
          >
            {local.categorias.map((categoria) => {
              const activa = categoriaActiva === categoria.id;
              const pausada = categoria.activa === false;
              return (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => irACategoria(categoria.id)}
                  className={`filter-chip shrink-0 px-4 py-1.5 text-xs font-bold transition-all ${
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
          <div className="px-4 pb-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={busquedaPlato}
                onChange={(e) => setBusquedaPlato(e.target.value)}
                placeholder={`Buscar en la carta de ${local.nombre}...`}
                aria-label={`Buscar platos en la carta de ${local.nombre}`}
                className={`w-full border py-2.5 pl-10 pr-9 text-xs focus:outline-none transition ${theme.searchInput}`}
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
        <main className="space-y-8 px-4 py-5">
          {categoriasFiltradas.length > 0 ? (
            categoriasFiltradas.map((categoria) => {
              const pausada = categoria.activa === false;
              return (
                <section
                  key={categoria.id}
                  id={`seccion-${categoria.id}`}
                  className="scroll-mt-32"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2
                        className={`font-display text-2xl tracking-wide uppercase ${
                          pausada
                            ? "text-stone-400 line-through decoration-stone-400"
                            : theme.categoryTitle
                        }`}
                      >
                        {categoria.nombre}
                      </h2>
                      {pausada && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 border border-slate-300 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">
                          ⏸️ Pausada por hoy
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${theme.categoryCount}`}
                    >
                      {categoria.productos.length}{" "}
                      {categoria.productos.length === 1 ? "opción" : "opciones"}
                    </span>
                  </div>

                  {pausada && (
                    <div className="mb-3 rounded-xl border border-slate-200 bg-slate-100/90 p-3 text-xs font-semibold text-slate-600">
                      ⏸️ Esta sección se encuentra pausada por hoy por reposición de stock.
                    </div>
                  )}

                  <div className="space-y-3">
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
          className={`border-t px-4 py-6 text-center text-xs ${theme.footerBg}`}
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
          className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-84 z-30 animate-in slide-in-from-bottom duration-300"
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
                <span className="block text-[10px] font-bold text-[#EA580C] tabular-nums mt-0.5">
                  #{pedidoActivo.codigoRetiro} • Toca para ver recibo
                </span>
              </div>
            </div>
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-stone-700">
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
