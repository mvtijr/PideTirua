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
  Copy,
  CheckCircle2,
  Landmark,
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
import { getLocalTheme } from "@/lib/localTheme";

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
  const [datosCopiados, setDatosCopiados] = useState(false);

  if (!abierto) return null;

  const theme = getLocalTheme(local.slug);

  const tieneDatosBancarios = Boolean(
    local.banco?.trim() ||
      local.tipo_cuenta?.trim() ||
      local.numero_cuenta?.trim() ||
      local.rut_titular?.trim() ||
      local.nombre_titular?.trim()
  );

  const handleCopiarDatosBancarios = async () => {
    const lineas = [
      `Datos de Transferencia - ${local.nombre}`,
      local.banco ? `Banco: ${local.banco}` : "",
      local.tipo_cuenta ? `Tipo de cuenta: ${local.tipo_cuenta}` : "",
      local.numero_cuenta ? `N° de cuenta: ${local.numero_cuenta}` : "",
      local.rut_titular ? `RUT: ${local.rut_titular}` : "",
      local.nombre_titular ? `Titular: ${local.nombre_titular}` : "",
      local.email_transferencia ? `Correo: ${local.email_transferencia}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(lineas);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = lineas;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setDatosCopiados(true);
      setTimeout(() => setDatosCopiados(false), 3000);
    } catch {
      // Ignorar si falla
    }
  };

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

  const handleEnviarWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (local.activo === false) {
      setErrorValidacion(
        "El servicio digital de este local se encuentra temporalmente suspendido."
      );
      return;
    }

    if (!local.abierto) {
      setErrorValidacion(
        "En este momento el local se encuentra cerrado y no está recibiendo pedidos."
      );
      return;
    }

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

    const payloadPedido = {
      local_slug: local.slug,
      cliente_nombre: nombreCliente.trim(),
      tipo_entrega: tipoEntrega === "Consumo en mesa" ? "Mesa" : "Retiro",
      direccion_mesa:
        direccionOMesa.trim() ||
        (tipoEntrega === "Consumo en mesa"
          ? "Mesa en salón"
          : `${local.nombre} (${local.ubicacion})`),
      metodo_pago:
        metodoPago === "Transferencia Bancaria" ? "Transferencia" : "Efectivo",
      notas: notasAdicionales.trim(),
      items: items.map(({ producto, cantidad }) => ({
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal: producto.precio * cantidad,
      })),
      total,
    };

    const url = buildWhatsAppCheckoutUrl({
      local,
      items,
      datos: datosCheckout,
    });

    // Mutación asíncrona con keepalive para registrar el pedido en Supabase (estado: 'pendiente')
    // mientras se abre WhatsApp sin bloquear el navegador móvil.
    const guardarPedidoPromise = fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify(payloadPedido),
    }).catch((err) => {
      console.error("Error registrando pedido en KDS:", err);
    });

    window.open(url, "_blank", "noopener,noreferrer");
    await guardarPedidoPromise;
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
          className={`flex items-center justify-between border-b px-4 py-4 sm:px-6 ${theme.drawerHeader}`}
        >
          <div>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${theme.drawerHeaderSub}`}
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
            className={`rounded-full p-2 transition ${theme.drawerCloseBtn}`}
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
            {/* Banner de advertencia si el local está cerrado */}
            {!local.abierto && (
              <div
                role="alert"
                className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm font-semibold leading-relaxed text-amber-950 shadow-sm"
              >
                <p>
                  ⚠️ En este momento el local se encuentra cerrado. Puedes
                  revisar la carta, pero no se están recibiendo pedidos.
                </p>
                {local.horario && (
                  <p className="mt-1 text-xs font-bold text-rose-700">
                    🔴 Horario de atención: {local.horario}
                  </p>
                )}
              </div>
            )}

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
                  className={`divide-y rounded-2xl border ${theme.drawerItemsBox}`}
                >
                  {items.map(({ producto, cantidad }) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between gap-3 p-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-bold ${theme.drawerItemTitle}`}
                        >
                          {producto.nombre}
                        </p>
                        <p className="text-xs font-medium text-on-surface-variant">
                          {formatCLP(producto.precio)} c/u ·{" "}
                          <strong className={theme.drawerItemTotal}>
                            {formatCLP(producto.precio * cantidad)}
                          </strong>
                        </p>
                      </div>

                      <div
                        className={`flex items-center gap-2 rounded-xl border bg-white p-1 shadow-2xs ${theme.cardCounterBox}`}
                      >
                        <button
                          type="button"
                          onClick={() => onDisminuir(producto.id)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg active:scale-95 ${theme.cardMinusBtn}`}
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span
                          className={`min-w-[1.25rem] text-center text-sm font-extrabold ${theme.cardQtyText}`}
                        >
                          {cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAgregar(producto)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg active:scale-95 ${theme.cardPlusBtn}`}
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
                          ? theme.drawerOptionActive
                          : "border-outline-variant/50 bg-white text-on-surface-variant hover:border-secondary"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          seleccionado
                            ? theme.drawerOptionIconActive
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
                <strong className={theme.drawerLabel}>{tipoEntrega}</strong>
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
                  className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold ${theme.drawerLabel}`}
                >
                  <User className={`h-3.5 w-3.5 ${theme.drawerLabelIcon}`} />
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
                  className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold ${theme.drawerLabel}`}
                >
                  <MapPin className={`h-3.5 w-3.5 ${theme.drawerLabelIcon}`} />
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
                  className={`mb-1.5 block text-xs font-bold ${theme.drawerLabel}`}
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
                            ? theme.drawerOptionActive
                            : "border-outline-variant/50 bg-white text-on-surface-variant hover:border-secondary"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            activo
                              ? theme.drawerOptionIconActive
                              : "text-outline"
                          }`}
                        />
                        <span>{etiqueta}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tarjeta visual destacada con Datos Bancarios si selecciona Transferencia Bancaria */}
                {metodoPago === "Transferencia Bancaria" && (
                  <div className="mt-3 space-y-2.5">
                    {tieneDatosBancarios && (
                      <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/70 p-3.5 text-slate-900 shadow-xs">
                        <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                            <Landmark className="h-4 w-4 text-emerald-700" />
                            Datos para Transferencia
                          </span>
                          <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                            {local.nombre}
                          </span>
                        </div>

                        <dl className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                          {local.banco && (
                            <div className="flex justify-between gap-2 rounded-lg bg-white/85 px-2.5 py-1.5 sm:block">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Banco
                              </dt>
                              <dd className="font-extrabold text-slate-900">
                                {local.banco}
                              </dd>
                            </div>
                          )}
                          {local.tipo_cuenta && (
                            <div className="flex justify-between gap-2 rounded-lg bg-white/85 px-2.5 py-1.5 sm:block">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Tipo de cuenta
                              </dt>
                              <dd className="font-extrabold text-slate-900">
                                {local.tipo_cuenta}
                              </dd>
                            </div>
                          )}
                          {local.numero_cuenta && (
                            <div className="flex justify-between gap-2 rounded-lg bg-white/85 px-2.5 py-1.5 sm:block">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                N° de cuenta
                              </dt>
                              <dd className="font-mono font-extrabold text-slate-900">
                                {local.numero_cuenta}
                              </dd>
                            </div>
                          )}
                          {local.rut_titular && (
                            <div className="flex justify-between gap-2 rounded-lg bg-white/85 px-2.5 py-1.5 sm:block">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                RUT
                              </dt>
                              <dd className="font-mono font-extrabold text-slate-900">
                                {local.rut_titular}
                              </dd>
                            </div>
                          )}
                          {local.nombre_titular && (
                            <div className="flex justify-between gap-2 rounded-lg bg-white/85 px-2.5 py-1.5 sm:col-span-2 sm:block">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Titular
                              </dt>
                              <dd className="font-extrabold text-slate-900">
                                {local.nombre_titular}
                              </dd>
                            </div>
                          )}
                          {local.email_transferencia && (
                            <div className="flex justify-between gap-2 rounded-lg bg-white/85 px-2.5 py-1.5 sm:col-span-2 sm:block">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Correo
                              </dt>
                              <dd className="font-semibold text-slate-800">
                                {local.email_transferencia}
                              </dd>
                            </div>
                          )}
                        </dl>

                        <button
                          type="button"
                          onClick={handleCopiarDatosBancarios}
                          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-extrabold shadow-xs transition active:scale-[0.99] ${
                            datosCopiados
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-emerald-600/30 bg-white text-emerald-900 hover:bg-emerald-100/70"
                          }`}
                        >
                          {datosCopiados ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                              <span>¡Datos bancarios copiados!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 shrink-0" />
                              <span>📋 Copiar datos de transferencia</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Texto recordatorio en color amigable */}
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-sky-950">
                      💡 Recuerda adjuntar el comprobante o captura de la
                      transferencia en el chat de WhatsApp que se abrirá al
                      confirmar el pedido.
                    </div>
                  </div>
                )}
              </div>

              {/* Notas adicionales */}
              <div>
                <label
                  htmlFor="notasAdicionales"
                  className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold ${theme.drawerLabel}`}
                >
                  <FileText
                    className={`h-3.5 w-3.5 ${theme.drawerLabelIcon}`}
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
                className={`flex w-full items-center justify-between text-xs font-bold ${theme.drawerLabel}`}
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
                  className={`mt-2.5 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 font-mono text-[11px] leading-relaxed ${theme.drawerPreviewBox}`}
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
              className={`mb-3 flex items-center justify-between text-base font-extrabold ${theme.drawerLabel}`}
            >
              <span>Total a pagar</span>
              <span className={`text-lg ${theme.drawerItemTotal}`}>
                {formatCLP(total)}
              </span>
            </div>

            <button
              type="submit"
              disabled={
                !local.abierto || local.activo === false || items.length === 0
              }
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-[#25D366]/25 transition hover:bg-[#20bd5a] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-65 disabled:shadow-none"
            >
              <MessageCircle className="h-5 w-5 fill-white" />
              <span>
                {local.activo === false
                  ? "Servicio Suspendido"
                  : local.abierto
                  ? "Enviar pedido a WhatsApp"
                  : "Local Cerrado por ahora"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
