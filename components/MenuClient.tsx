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
import ProductCard from "@/components/ProductCard";
import FloatingCartBar from "@/components/FloatingCartBar";
import CartDrawer from "@/components/CartDrawer";

interface MenuClientProps {
  local: Local;
}

export default function MenuClient({ local }: MenuClientProps) {
  const storageKey = `pidetirua_cart_${local.slug}`;
  const esLasTranqueras = local.slug === "las-tranqueras";

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
    <div
      className={`relative min-h-screen pb-28 ${
        esLasTranqueras ? "bg-[#171614]" : "bg-surface"
      }`}
    >
      {/* Video de fondo fijo a pantalla completa para la carta digital de Las Tranqueras (vista completa sin recorte) */}
      {esLasTranqueras && (local.videoFondo || local.videoPortada) && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#171614]">
          {/* Capa ambiental difuminada para rellenar bordes en pantallas verticales o ultra-anchas */}
          <video
            src={local.videoFondo || local.videoPortada}
            poster={local.fotoPortada}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover blur-xl opacity-45"
          />
          {/* Video principal alejado (object-contain) para que se vea completo de extremo a extremo */}
          <video
            src={local.videoFondo || local.videoPortada}
            poster={local.fotoPortada}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-contain blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#171614]/60 via-[#171614]/50 to-[#171614]/75" />
        </div>
      )}

      {/* Contenedor Mobile-First (optimizado para lectura QR en celular) */}
      <div
        className={`relative z-10 mx-auto max-w-xl min-h-screen ${
          esLasTranqueras
            ? "bg-[#171614]/40 backdrop-blur-[2px] shadow-2xl sm:border-x sm:border-[#F8DC4B]/25"
            : "bg-surface-container-lowest shadow-md"
        }`}
      >
        {/* Portada e Identidad del Local */}
        <header className="relative">
          <div
            className={`relative w-full overflow-hidden ${
              local.videoPortada
                ? "aspect-video"
                : "h-52 sm:h-60"
            } ${esLasTranqueras ? "bg-[#171614]" : "bg-primary"}`}
          >
            {local.videoPortada ? (
              <video
                src={local.videoPortada}
                poster={local.fotoPortada}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-contain bg-[#171614]"
              />
            ) : (
              <img
                src={local.fotoPortada}
                alt={local.nombre}
                className="h-full w-full object-cover"
              />
            )}
            <div
              className={`absolute inset-0 bg-gradient-to-t ${
                esLasTranqueras
                  ? "from-[#171614]/95 via-[#171614]/45 to-black/25"
                  : "from-primary/95 via-primary/45 to-primary/30"
              }`}
            />

            {/* Barra superior de navegación */}
            <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
              <Link
                href="/"
                className={`inline-flex items-center gap-2 rounded-full pl-2 pr-3.5 py-1.5 text-xs font-bold backdrop-blur-md transition ${
                  esLasTranqueras
                    ? "bg-[#171614]/90 text-[#F8DC4B] ring-1 ring-[#F8DC4B]/50 hover:bg-[#171614]"
                    : "bg-primary/85 text-on-primary hover:bg-primary"
                }`}
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shadow backdrop-blur-md transition ${
                    esLasTranqueras
                      ? "bg-[#F8DC4B] text-[#171614] hover:bg-[#f6d52b]"
                      : "bg-surface-container-lowest/95 text-primary hover:bg-white"
                  }`}
                  aria-label="Mostrar código QR del local"
                >
                  <QrCode
                    className={`h-3.5 w-3.5 ${
                      esLasTranqueras ? "text-[#171614]" : "text-secondary"
                    }`}
                  />
                  <span>QR Mesa</span>
                </button>
              </div>
            </div>

            {/* Logo y título sobre la portada */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3.5">
              <div
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 shadow-lg sm:h-20 sm:w-20 ${
                  esLasTranqueras
                    ? "border-[#F8DC4B] bg-[#F8DC4B]"
                    : "border-white bg-white"
                }`}
              >
                <img
                  src={local.logo}
                  alt={`Logo ${local.nombre}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-on-primary">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      esLasTranqueras
                        ? "bg-[#F8DC4B] text-[#171614]"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {local.abierto ? "Abierto" : "Cerrado"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-[#F8DC4B]">
                    <Star className="h-3 w-3 fill-[#F8DC4B] text-[#F8DC4B]" />
                    {local.calificacion.toFixed(1)}
                  </span>
                </div>
                <h1 className="mt-1 truncate text-xl font-extrabold leading-tight sm:text-2xl">
                  {local.nombre}
                </h1>
                <p
                  className={`truncate text-xs font-bold ${
                    esLasTranqueras
                      ? "text-[#F8DC4B]"
                      : "text-secondary-fixed"
                  }`}
                >
                  {local.rubro}
                </p>
              </div>
            </div>
          </div>

          {/* Ficha informativa del Local + Botón de Llamada Directa */}
          <div
            className={`border-b px-4 py-4 ${
              esLasTranqueras
                ? "border-[#F8DC4B]/30 bg-[#171614]/80 backdrop-blur-md"
                : "border-outline-variant/40 bg-surface-container-lowest"
            }`}
          >
            <p
              className={`text-xs leading-relaxed sm:text-sm ${
                esLasTranqueras
                  ? "text-[#FFFDF2]/90"
                  : "text-on-surface-variant"
              }`}
            >
              {local.descripcionCorta}
            </p>

            <div
              className={`mt-3.5 grid grid-cols-1 gap-2 rounded-2xl p-3 text-xs sm:grid-cols-2 ${
                esLasTranqueras
                  ? "border border-[#F8DC4B]/45 bg-[#171614]/75 text-[#FFFDF2]"
                  : "bg-surface-container-low text-on-surface"
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    esLasTranqueras ? "text-[#F8DC4B]" : "text-secondary"
                  }`}
                />
                <div>
                  <span
                    className={`font-bold ${
                      esLasTranqueras ? "text-[#F8DC4B]" : "text-primary"
                    }`}
                  >
                    {local.ubicacion}
                  </span>
                  <p
                    className={`text-[11px] ${
                      esLasTranqueras
                        ? "text-[#FFFDF2]/80"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {local.direccionDetalle}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    esLasTranqueras ? "text-[#F8DC4B]" : "text-tertiary"
                  }`}
                />
                <div>
                  <span
                    className={`font-bold ${
                      esLasTranqueras ? "text-[#F8DC4B]" : "text-primary"
                    }`}
                  >
                    Preparación est.: {local.tiempoEstimado}
                  </span>
                  <p
                    className={`text-[11px] ${
                      esLasTranqueras
                        ? "text-[#FFFDF2]/80"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {local.horarioEntrega}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones rápidas: Modalidades de atención y llamada directa */}
            <div className="mt-3.5 flex items-center justify-between gap-3">
              <div
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                  esLasTranqueras
                    ? "bg-[#F8DC4B]/20 text-[#F8DC4B] border border-[#F8DC4B]/55"
                    : "bg-surface-container text-primary"
                }`}
              >
                <Store
                  className={`h-4 w-4 ${
                    esLasTranqueras ? "text-[#F8DC4B]" : "text-secondary"
                  }`}
                />
                <span>Retiro en local y Consumo en mesa</span>
              </div>

              <a
                href={`tel:+${local.telefonoWhatsapp}`}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 ${
                  esLasTranqueras
                    ? "bg-[#F8DC4B] text-[#171614] hover:bg-[#f6d52b]"
                    : "bg-primary text-on-primary hover:bg-primary-container"
                }`}
              >
                <Phone
                  className={`h-3.5 w-3.5 ${
                    esLasTranqueras
                      ? "text-[#171614]"
                      : "text-secondary-fixed"
                  }`}
                />
                <span>Llamar al local</span>
              </a>
            </div>
          </div>
        </header>

        {/* Pestañas Sticky de Categorías + Buscador de Platos */}
        <div
          className={`sticky top-0 z-30 border-b backdrop-blur-md ${
            esLasTranqueras
              ? "border-[#F8DC4B]/35 bg-[#171614]/85"
              : "border-outline-variant/40 bg-surface-container-lowest/95"
          }`}
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
                    esLasTranqueras
                      ? activa
                        ? "bg-[#F8DC4B] text-[#171614] ring-2 ring-[#F8DC4B] shadow-sm"
                        : "bg-white/10 text-[#FFFDF2] border border-[#F8DC4B]/40 hover:bg-[#F8DC4B]/20"
                      : activa
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
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
                className={`w-full rounded-xl border py-2 pl-9 pr-8 text-xs text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none ${
                  esLasTranqueras
                    ? "border-[#F8DC4B]/60 bg-[#FFFDF2]/95 focus:border-[#F8DC4B]"
                    : "border-outline-variant/40 bg-surface-container-low focus:border-secondary"
                }`}
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
                    className={`text-lg font-extrabold tracking-tight ${
                      esLasTranqueras
                        ? "text-[#F8DC4B] drop-shadow-sm"
                        : "text-primary"
                    }`}
                  >
                    {categoria.nombre}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      esLasTranqueras
                        ? "bg-[#F8DC4B] text-[#171614] font-bold shadow-sm"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
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
                      esLasTranqueras={esLasTranqueras}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div
              className={`rounded-2xl border border-dashed p-8 text-center ${
                esLasTranqueras
                  ? "border-[#F8DC4B]/50 bg-[#171614]/80 backdrop-blur-md"
                  : "border-outline-variant"
              }`}
            >
              <UtensilsCrossed
                className={`mx-auto h-8 w-8 ${
                  esLasTranqueras ? "text-[#F8DC4B]" : "text-outline"
                }`}
              />
              <p
                className={`mt-2 text-sm font-bold ${
                  esLasTranqueras ? "text-[#FFFDF2]" : "text-primary"
                }`}
              >
                No encontramos platos con &ldquo;{busquedaPlato}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setBusquedaPlato("")}
                className={`mt-3 text-xs font-bold underline ${
                  esLasTranqueras ? "text-[#F8DC4B]" : "text-secondary"
                }`}
              >
                Mostrar toda la carta
              </button>
            </div>
          )}
        </main>

        {/* Pie del menú exclusivo */}
        <footer
          className={`border-t px-4 py-6 text-center text-xs ${
            esLasTranqueras
              ? "border-[#F8DC4B]/35 bg-[#171614]/85 text-[#FFFDF2]/85 backdrop-blur-md"
              : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant"
          }`}
        >
          <p
            className={`font-bold ${
              esLasTranqueras ? "text-[#F8DC4B]" : "text-primary"
            }`}
          >
            {local.nombre}
          </p>
          <p className="mt-0.5">
            {local.direccionDetalle} · WhatsApp{" "}
            {formatPhoneDisplay(local.telefonoWhatsapp)}
          </p>
          <div
            className={`mt-3 flex items-center justify-center gap-2 text-[11px] ${
              esLasTranqueras ? "text-[#FFFDF2]/75" : "text-outline"
            }`}
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
                className={`font-bold hover:underline ${
                  esLasTranqueras ? "text-[#F8DC4B]" : "text-secondary"
                }`}
              >
                PideTirúa
              </Link>
            </span>
          </div>
        </footer>
      </div>

      {/* Carrito flotante inferior */}
      <FloatingCartBar
        totalUnidades={totalUnidades}
        subtotal={subtotal}
        onOpenDrawer={() => setDrawerAbierto(true)}
        esLasTranqueras={esLasTranqueras}
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
                className={`text-xs font-bold uppercase tracking-wider ${
                  esLasTranqueras ? "text-[#171614]" : "text-secondary"
                }`}
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
            <h3
              className={`mt-1 text-base font-extrabold ${
                esLasTranqueras ? "text-[#171614]" : "text-primary"
              }`}
            >
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
