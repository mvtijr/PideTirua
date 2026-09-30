"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { ItemCarrito, Local, Producto } from "@/types/local";
import { formatPhoneDisplay } from "@/lib/formatters";
import { getLocalTheme, getVideoPoster } from "@/lib/localTheme";
import ProductCard from "@/components/ProductCard";
import FloatingCartBar from "@/components/FloatingCartBar";
import CartDrawer from "@/components/CartDrawer";

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

  const handleAgregarProducto = (producto: Producto) => {
    if (producto.disponible === false || localSuspendido) return;
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const handleDisminuirProducto = (productoId: string) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.producto.id === productoId
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const handleVaciarCarrito = () => {
    setCarrito([]);
  };

  const cantidadPorProducto = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const item of carrito) {
      mapa.set(item.producto.id, item.cantidad);
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
        (acc, item) => acc + item.producto.precio * item.cantidad,
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
    <div className={`relative min-h-screen pb-28 ${theme.pageBg}`}>
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
            preload="auto"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-contain blur-[2px]"
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
                autoPlay
                loop
                muted
                playsInline
                poster={local.banner_url || posterPortada || undefined}
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={bannerVideoUrl} type="video/mp4" />
                <source src={bannerVideoUrl} type="video/webm" />
              </video>
            ) : (
              <img
                src={bannerPrincipal}
                alt={local.nombre}
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
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 shadow-lg sm:h-20 sm:w-20 ${theme.logoBox}`}
              >
                <img
                  src={logoPrincipal}
                  alt={`Logo ${local.nombre}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-on-primary">
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
                      ? "⛔ Servicio Temporalmente Suspendido"
                      : local.abierto
                      ? `🟢 Abierto • ${local.horario}`
                      : `🔴 Cerrado • Abre hoy a las ${horaApertura} hrs`}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-[#F8DC4B]">
                    <Star className="h-3 w-3 fill-[#F8DC4B] text-[#F8DC4B]" />
                    {local.calificacion.toFixed(1)}
                  </span>
                </div>
                <h1 className="mt-1 truncate text-xl font-extrabold leading-tight sm:text-2xl">
                  {local.nombre}
                </h1>
                <p className={`truncate text-xs font-bold ${theme.rubroText}`}>
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

          {/* Ficha informativa del Local + Botón de Llamada Directa */}
          <div className={`border-b px-4 py-4 ${theme.infoSectionBg}`}>
            {/* Cabecera compacta con Nombre, Dirección, Horario y Botón de Llamada Rápida */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      localSuspendido
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/45"
                        : local.abierto
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35"
                        : "bg-rose-500/15 text-rose-400 border-rose-500/35"
                    }`}
                  >
                    {localSuspendido
                      ? "⛔ Servicio Temporalmente Suspendido"
                      : local.abierto
                      ? `🟢 Abierto • ${local.horario}`
                      : `🔴 Cerrado • Abre hoy a las ${horaApertura} hrs`}
                  </span>
                </div>
                <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${theme.infoSub}`}>
                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${theme.infoIcon}`} />
                  <span className="truncate">{local.direccionDetalle}</span>
                </p>
              </div>

              <a
                href={`tel:+${telefonoDirecto}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-300 shadow-sm backdrop-blur-sm transition hover:bg-emerald-500/25 active:scale-95"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>Llamar al local</span>
              </a>
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
                    Preparación est.: {local.tiempoEstimado}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones rápidas: Modalidades de atención y llamada directa */}
            <div className="mt-3.5 flex items-center justify-between gap-3">
              <div
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${theme.modalityBadge}`}
              >
                <Store className={`h-4 w-4 ${theme.modalityIcon}`} />
                <span>Retiro en local y Consumo en mesa</span>
              </div>

              <a
                href={`tel:+${telefonoDirecto}`}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 ${theme.callBtn}`}
              >
                <Phone className={`h-3.5 w-3.5 ${theme.callIcon}`} />
                <span>Llamar al local</span>
              </a>
            </div>
          </div>
        </header>

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
              return (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => irACategoria(categoria.id)}
                  className={`filter-chip shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    activa ? theme.tabActive : theme.tabInactive
                  }`}
                >
                  {categoria.nombre}
                </button>
              );
            })}
          </nav>

          {/* Buscador rápido dentro de la carta */}
          <div className="px-4 pb-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={busquedaPlato}
                onChange={(e) => setBusquedaPlato(e.target.value)}
                placeholder={`Buscar en la carta de ${local.nombre}...`}
                className={`w-full rounded-xl border py-2 pl-9 pr-8 text-xs text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none ${theme.searchInput}`}
              />
              {busquedaPlato && (
                <button
                  type="button"
                  onClick={() => setBusquedaPlato("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
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
            categoriasFiltradas.map((categoria) => (
              <section
                key={categoria.id}
                id={`seccion-${categoria.id}`}
                className="scroll-mt-32"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2
                    className={`text-lg font-extrabold tracking-tight ${theme.categoryTitle}`}
                  >
                    {categoria.nombre}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${theme.categoryCount}`}
                  >
                    {categoria.productos.length}{" "}
                    {categoria.productos.length === 1 ? "opción" : "opciones"}
                  </span>
                </div>

                <div className="space-y-3">
                  {categoria.productos.map((producto) => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      cantidadEnCarrito={
                        cantidadPorProducto.get(producto.id) ?? 0
                      }
                      onAgregar={handleAgregarProducto}
                      onDisminuir={handleDisminuirProducto}
                      localSlug={local.slug}
                    />
                  ))}
                </div>
              </section>
            ))
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
        onDisminuir={handleDisminuirProducto}
        onVaciar={handleVaciarCarrito}
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
