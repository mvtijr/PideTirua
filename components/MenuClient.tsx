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
  Bike,
  UtensilsCrossed,
} from "lucide-react";
import { ItemCarrito, Local, Producto } from "@/types/local";
import { formatCLP, formatPhoneDisplay } from "@/lib/formatters";
import ProductCard from "@/components/ProductCard";
import FloatingCartBar from "@/components/FloatingCartBar";
import CartDrawer from "@/components/CartDrawer";

interface MenuClientProps {
  local: Local;
}

export default function MenuClient({ local }: MenuClientProps) {
  const storageKey = `pidetirua_cart_${local.slug}`;

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
    <div className="min-h-screen bg-surface pb-28">
      {/* Contenedor Mobile-First (optimizado para lectura QR en celular) */}
      <div className="mx-auto max-w-xl bg-surface-container-lowest shadow-md min-h-screen">
        {/* Portada e Identidad del Local */}
        <header className="relative">
          <div className="relative h-52 w-full overflow-hidden bg-primary sm:h-60">
            <img
              src={local.fotoPortada}
              alt={local.nombre}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/45 to-primary/30" />

            {/* Barra superior de navegación */}
            <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-primary/85 pl-2 pr-3.5 py-1.5 text-xs font-bold text-on-primary backdrop-blur-md transition hover:bg-primary"
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/95 px-3 py-2 text-xs font-bold text-primary shadow backdrop-blur-md transition hover:bg-white"
                  aria-label="Mostrar código QR del local"
                >
                  <QrCode className="h-3.5 w-3.5 text-secondary" />
                  <span>QR Mesa</span>
                </button>
              </div>
            </div>

            {/* Logo y título sobre la portada */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3.5">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-lg sm:h-20 sm:w-20">
                <img
                  src={local.logo}
                  alt={`Logo ${local.nombre}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-on-primary">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    {local.abierto ? "Abierto" : "Cerrado"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-amber-300">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {local.calificacion.toFixed(1)}
                  </span>
                </div>
                <h1 className="mt-1 truncate text-xl font-extrabold leading-tight sm:text-2xl">
                  {local.nombre}
                </h1>
                <p className="truncate text-xs font-medium text-secondary-fixed">
                  {local.rubro}
                </p>
              </div>
            </div>
          </div>

          {/* Ficha informativa del Local + Botón de Llamada Directa */}
          <div className="border-b border-outline-variant/40 bg-surface-container-lowest px-4 py-4">
            <p className="text-xs leading-relaxed text-on-surface-variant sm:text-sm">
              {local.descripcionCorta}
            </p>

            <div className="mt-3.5 grid grid-cols-1 gap-2 rounded-2xl bg-surface-container-low p-3 text-xs text-on-surface sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                <div>
                  <span className="font-bold text-primary">
                    {local.ubicacion}
                  </span>
                  <p className="text-[11px] text-on-surface-variant">
                    {local.direccionDetalle}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
                <div>
                  <span className="font-bold text-primary">
                    Entrega est.: {local.tiempoEstimado}
                  </span>
                  <p className="text-[11px] text-on-surface-variant">
                    {local.horarioEntrega}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones rápidas: Llamada directa y costo de envío */}
            <div className="mt-3.5 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container px-3 py-2 text-xs font-semibold text-primary">
                <Bike className="h-4 w-4 text-secondary" />
                <span>
                  Delivery:{" "}
                  <strong>
                    {local.costoDelivery > 0
                      ? formatCLP(local.costoDelivery)
                      : "Gratis"}
                  </strong>
                </span>
              </div>

              <a
                href={`tel:+${local.telefonoWhatsapp}`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition hover:bg-primary-container active:scale-95"
              >
                <Phone className="h-3.5 w-3.5 text-secondary-fixed" />
                <span>Llamar al local</span>
              </a>
            </div>
          </div>
        </header>

        {/* Pestañas Sticky de Categorías + Buscador de Platos */}
        <div className="sticky top-0 z-30 border-b border-outline-variant/40 bg-surface-container-lowest/95 backdrop-blur-md">
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
                    activa
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
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low py-2 pl-9 pr-8 text-xs text-on-surface placeholder:text-outline focus:border-secondary focus:bg-surface-container-lowest focus:outline-none"
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
                  <h2 className="text-lg font-extrabold tracking-tight text-primary">
                    {categoria.nombre}
                  </h2>
                  <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
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
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-outline-variant p-8 text-center">
              <UtensilsCrossed className="mx-auto h-8 w-8 text-outline" />
              <p className="mt-2 text-sm font-bold text-primary">
                No encontramos platos con &ldquo;{busquedaPlato}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setBusquedaPlato("")}
                className="mt-3 text-xs font-bold text-secondary underline"
              >
                Mostrar toda la carta
              </button>
            </div>
          )}
        </main>

        {/* Pie del menú exclusivo */}
        <footer className="border-t border-outline-variant/40 bg-surface-container-low px-4 py-6 text-center text-xs text-on-surface-variant">
          <p className="font-bold text-primary">{local.nombre}</p>
          <p className="mt-0.5">
            {local.direccionDetalle} · WhatsApp{" "}
            {formatPhoneDisplay(local.telefonoWhatsapp)}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-outline">
            <img
              src="/logo-pidetirua.jpg"
              alt="Logo PideTirúa"
              className="h-6 w-6 rounded-full object-contain border border-outline-variant/40 bg-white"
            />
            <span>
              Menú digital interactivo impulsado por{" "}
              <Link href="/" className="font-bold text-secondary hover:underline">
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
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
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
            <h3 className="mt-1 text-base font-extrabold text-primary">
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
