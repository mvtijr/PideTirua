"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Store,
  Utensils,
  User,
  MapPin,
  CreditCard,
  Banknote,
  FileText,
  MessageCircle,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  DatosCheckout,
  ItemCarrito,
  Local,
  MetodoPago,
  Producto,
  TipoEntrega,
} from "@/types/local";
import {
  buildWhatsAppCheckoutUrl,
  calcularTotalesCarrito,
  formatCLP,
  formatPhoneDisplay,
  formatWhatsAppMessage,
} from "@/lib/formatters";

interface CartDrawerProps {
  abierto: boolean;
  onClose: () => void;
  local: Local;
  items: ItemCarrito[];
  onAgregar: (producto: Producto) => void;
  onDisminuir: (productoId: string) => void;
  onVaciar: () => void;
}

const MODALIDADES_PEDIDO: {
  valor: TipoEntrega;
  etiqueta: string;
  icono: typeof Store;
}[] = [
  { valor: "Retiro en local", etiqueta: "Retiro en local", icono: Store },
  { valor: "Consumo en mesa", etiqueta: "Consumo en mesa", icono: Utensils },
];

const METODOS_PAGO: {
  valor: MetodoPago;
  etiqueta: string;
  icono: typeof Banknote;
}[] = [
  { valor: "Efectivo", etiqueta: "Efectivo", icono: Banknote },
  {
    valor: "Transferencia Bancaria",
    etiqueta: "Transferencia Bancaria",
    icono: CreditCard,
  },
];

export default function CartDrawer({
  abierto,
  onClose,
  local,
  items,
  onAgregar,
  onDisminuir,
  onVaciar,
}: CartDrawerProps) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [tipoEntrega, setTipoEntrega] =
    useState<TipoEntrega>("Retiro en local");
  const [direccionOMesa, setDireccionOMesa] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("Efectivo");
  const [notasAdicionales, setNotasAdicionales] = useState("");
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  if (!abierto) return null;

  const esLasTranqueras = local.slug === "las-tranqueras";

  const datosCheckout: DatosCheckout = {
    nombreCliente,
    tipoEntrega,
    direccionOMesa,
    metodoPago,
    notasAdicionales,
  };

  const { total, totalUnidades } = calcularTotalesCarrito(items);

  const placeholderUbicacion =
    tipoEntrega === "Consumo en mesa"
      ? "Ej: Mesa 4 (Terraza interior)"
      : `Retiro en ${local.direccionDetalle} (opcional: indicar hora)`;

  const labelUbicacion =
    tipoEntrega === "Consumo en mesa"
      ? "Número de mesa *"
      : "Referencia u hora de retiro en local (opcional)";

  const handleEnviarWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setErrorValidacion("Agrega al menos un producto a tu pedido.");
      return;
    }

    if (!nombreCliente.trim()) {
      setErrorValidacion("Por favor ingresa tu nombre para el pedido.");
      return;
    }

    if (tipoEntrega === "Consumo en mesa" && !direccionOMesa.trim()) {
      setErrorValidacion("Por favor indica tu número de mesa.");
      return;
    }

    setErrorValidacion(null);
    const url = buildWhatsAppCheckoutUrl({
      local,
      items,
      datos: datosCheckout,
    });

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const mensajePrevia = formatWhatsAppMessage({
    local,
    items,
    datos: {
      ...datosCheckout,
      nombreCliente: nombreCliente || "Juan Pérez",
      direccionOMesa:
        direccionOMesa ||
        (tipoEntrega === "Consumo en mesa"
          ? "Mesa 3"
          : `${local.nombre} (${local.ubicacion})`),
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      {/* Panel lateral / Drawer mobile-first */}
      <div
        className="flex h-full w-full max-w-lg flex-col bg-surface-container-lowest shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Drawer */}
        <div
          className={`flex items-center justify-between border-b px-4 py-4 sm:px-6 ${
            esLasTranqueras
              ? "border-[#F8DC4B]/30 bg-[#171614] text-white"
              : "border-outline-variant/30 bg-primary text-on-primary"
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                esLasTranqueras ? "text-[#F8DC4B]" : "text-secondary-fixed"
              }`}
            >
              Pedido directo a WhatsApp
            </span>
            <h2 className="text-lg font-extrabold leading-tight">
              Tu Pedido en {local.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 transition ${
              esLasTranqueras
                ? "bg-neutral-800 text-[#F8DC4B] hover:bg-[#F8DC4B] hover:text-[#171614]"
                : "bg-primary-container text-secondary-fixed hover:bg-secondary hover:text-white"
            }`}
            aria-label="Cerrar carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <form
          onSubmit={handleEnviarWhatsApp}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
            {/* 1. Lista de ítems seleccionados */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                  Productos ({totalUnidades})
                </h3>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={onVaciar}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-error hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Vaciar carrito
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
                  Tu carrito está vacío. Agrega platos de la carta para armar tu
                  pedido.
                </div>
              ) : (
                <div
                  className={`divide-y rounded-2xl border ${
                    esLasTranqueras
                      ? "divide-[#F8DC4B]/30 border-[#F8DC4B]/50 bg-[#FFFDF2]"
                      : "divide-outline-variant/30 border-outline-variant/40 bg-surface-container-low/60"
                  }`}
                >
                  {items.map(({ producto, cantidad }) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between gap-3 p-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-bold ${
                            esLasTranqueras ? "text-[#171614]" : "text-primary"
                          }`}
                        >
                          {producto.nombre}
                        </p>
                        <p className="text-xs font-medium text-on-surface-variant">
                          {formatCLP(producto.precio)} c/u ·{" "}
                          <strong
                            className={
                              esLasTranqueras
                                ? "text-[#171614]"
                                : "text-tertiary"
                            }
                          >
                            {formatCLP(producto.precio * cantidad)}
                          </strong>
                        </p>
                      </div>

                      <div
                        className={`flex items-center gap-2 rounded-xl border bg-white p-1 shadow-2xs ${
                          esLasTranqueras
                            ? "border-[#F8DC4B]"
                            : "border-outline-variant/50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onDisminuir(producto.id)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg active:scale-95 ${
                            esLasTranqueras
                              ? "bg-[#FEF9C3] text-[#171614] hover:bg-[#F8DC4B]"
                              : "bg-surface-container text-primary hover:bg-surface-container-high"
                          }`}
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span
                          className={`min-w-[1.25rem] text-center text-sm font-extrabold ${
                            esLasTranqueras ? "text-[#171614]" : "text-primary"
                          }`}
                        >
                          {cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAgregar(producto)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg active:scale-95 ${
                            esLasTranqueras
                              ? "bg-[#171614] text-[#F8DC4B] hover:bg-neutral-800"
                              : "bg-primary text-on-primary hover:bg-primary-container"
                          }`}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Selector de Modalidad (Retiro en local o Consumo en mesa) */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Modalidad del pedido
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {MODALIDADES_PEDIDO.map(({ valor, etiqueta, icono: Icon }) => {
                  const seleccionado = tipoEntrega === valor;
                  return (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => {
                        setTipoEntrega(valor);
                        setErrorValidacion(null);
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center text-xs font-bold transition ${
                        seleccionado
                          ? esLasTranqueras
                            ? "border-[#171614] bg-[#FEF9C3]/60 text-[#171614] ring-2 ring-[#F8DC4B]"
                            : "border-primary bg-surface-container text-primary ring-2 ring-primary/20"
                          : "border-outline-variant/50 bg-white text-on-surface-variant hover:border-secondary"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          seleccionado
                            ? esLasTranqueras
                              ? "text-[#171614]"
                              : "text-secondary"
                            : "text-outline"
                        }`}
                      />
                      <span>{etiqueta}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-on-surface-variant">
                Modalidad seleccionada:{" "}
                <strong
                  className={
                    esLasTranqueras ? "text-[#171614]" : "text-primary"
                  }
                >
                  {tipoEntrega}
                </strong>
              </p>
            </div>

            {/* 3. Inputs del cliente */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Datos para el pedido
              </h3>

              {/* Nombre del cliente */}
              <div>
                <label
                  htmlFor="nombreCliente"
                  className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold ${
                    esLasTranqueras ? "text-[#171614]" : "text-primary"
                  }`}
                >
                  <User
                    className={`h-3.5 w-3.5 ${
                      esLasTranqueras ? "text-[#171614]" : "text-secondary"
                    }`}
                  />
                  Nombre del cliente *
                </label>
                <input
                  id="nombreCliente"
                  type="text"
                  value={nombreCliente}
                  onChange={(e) => {
                    setNombreCliente(e.target.value);
                    if (errorValidacion) setErrorValidacion(null);
                  }}
                  placeholder="Ej: Camila Nahuelpán"
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              {/* Mesa o Referencia de Retiro */}
              <div>
                <label
                  htmlFor="direccionOMesa"
                  className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold ${
                    esLasTranqueras ? "text-[#171614]" : "text-primary"
                  }`}
                >
                  <MapPin
                    className={`h-3.5 w-3.5 ${
                      esLasTranqueras ? "text-[#171614]" : "text-secondary"
                    }`}
                  />
                  {labelUbicacion}
                </label>
                <input
                  id="direccionOMesa"
                  type="text"
                  value={direccionOMesa}
                  onChange={(e) => {
                    setDireccionOMesa(e.target.value);
                    if (errorValidacion) setErrorValidacion(null);
                  }}
                  placeholder={placeholderUbicacion}
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              {/* Método de pago */}
              <div>
                <span
                  className={`mb-1.5 block text-xs font-bold ${
                    esLasTranqueras ? "text-[#171614]" : "text-primary"
                  }`}
                >
                  Método de pago
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {METODOS_PAGO.map(({ valor, etiqueta, icono: Icon }) => {
                    const activo = metodoPago === valor;
                    return (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => setMetodoPago(valor)}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                          activo
                            ? esLasTranqueras
                              ? "border-[#171614] bg-[#FEF9C3]/60 text-[#171614] ring-2 ring-[#F8DC4B]"
                              : "border-primary bg-surface-container text-primary ring-2 ring-primary/20"
                            : "border-outline-variant/50 bg-white text-on-surface-variant hover:border-secondary"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            activo
                              ? esLasTranqueras
                                ? "text-[#171614]"
                                : "text-secondary"
                              : "text-outline"
                          }`}
                        />
                        <span>{etiqueta}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notas adicionales */}
              <div>
                <label
                  htmlFor="notasAdicionales"
                  className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold ${
                    esLasTranqueras ? "text-[#171614]" : "text-primary"
                  }`}
                >
                  <FileText
                    className={`h-3.5 w-3.5 ${
                      esLasTranqueras ? "text-[#171614]" : "text-secondary"
                    }`}
                  />
                  Notas adicionales (opcional)
                </label>
                <textarea
                  id="notasAdicionales"
                  rows={2}
                  value={notasAdicionales}
                  onChange={(e) => setNotasAdicionales(e.target.value)}
                  placeholder='Ej: "Sin cebolla", "Salsa soya extra", "Para llevar bien sellado"'
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            </div>

            {/* Vista previa opcional del mensaje de WhatsApp */}
            <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
              <button
                type="button"
                onClick={() => setMostrarVistaPrevia((prev) => !prev)}
                className={`flex w-full items-center justify-between text-xs font-bold ${
                  esLasTranqueras ? "text-[#171614]" : "text-primary"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-[#25D366]" />
                  Ver formato del mensaje WhatsApp (
                  {formatPhoneDisplay(local.telefonoWhatsapp)})
                </span>
                <span className="underline">
                  {mostrarVistaPrevia ? "Ocultar" : "Mostrar"}
                </span>
              </button>
              {mostrarVistaPrevia && (
                <pre
                  className={`mt-2.5 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 font-mono text-[11px] leading-relaxed ${
                    esLasTranqueras
                      ? "bg-[#171614] text-[#F8DC4B]"
                      : "bg-primary text-secondary-fixed"
                  }`}
                >
                  {mensajePrevia}
                </pre>
              )}
            </div>

            {errorValidacion && (
              <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error-container p-3 text-xs font-semibold text-on-error-container">
                <AlertCircle className="h-4 w-4 shrink-0 text-error" />
                <span>{errorValidacion}</span>
              </div>
            )}
          </div>

          {/* Resumen de Total y Botón de Checkout a WhatsApp */}
          <div className="border-t border-outline-variant/40 bg-surface-container-low p-4 sm:px-6">
            <div
              className={`mb-3 flex items-center justify-between text-base font-extrabold ${
                esLasTranqueras ? "text-[#171614]" : "text-primary"
              }`}
            >
              <span>Total a pagar</span>
              <span
                className={`text-lg ${
                  esLasTranqueras ? "text-[#171614]" : "text-tertiary"
                }`}
              >
                {formatCLP(total)}
              </span>
            </div>

            <button
              type="submit"
              disabled={items.length === 0}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-[#25D366]/25 transition hover:bg-[#20bd5a] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-outline-variant disabled:shadow-none"
            >
              <MessageCircle className="h-5 w-5 fill-white" />
              <span>Enviar pedido a WhatsApp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
