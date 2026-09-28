import { DatosCheckout, ItemCarrito, Local } from "@/types/local";

/**
 * Formatea un número como Peso Chileno ($ CLP con puntos de miles, ej: $12.500).
 * Implementación determinista para evitar diferencias de hidratación SSR/CSR.
 */
export function formatCLP(monto: number): string {
  const entero = Math.round(monto);
  const conPuntos = entero
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${conPuntos}`;
}

/**
 * Formatea un teléfono chileno 569XXXXXXXX para lectura humana (+56 9 XXXX XXXX).
 */
export function formatPhoneDisplay(telefono: string): string {
  const limpio = telefono.replace(/\D/g, "");
  if (limpio.length === 11 && limpio.startsWith("569")) {
    return `+56 9 ${limpio.slice(3, 7)} ${limpio.slice(7)}`;
  }
  return `+${limpio}`;
}

interface WhatsAppOrderPayload {
  local: Local;
  items: ItemCarrito[];
  datos: DatosCheckout;
}

/**
 * Calcula subtotal, recargo de delivery (solo si aplica) y total general.
 */
export function calcularTotalesCarrito(
  items: ItemCarrito[],
  costoDeliveryLocal: number,
  tipoEntrega: DatosCheckout["tipoEntrega"]
) {
  const subtotal = items.reduce(
    (acc, item) => acc + item.producto.precio * item.cantidad,
    0
  );
  const recargoDelivery =
    tipoEntrega === "Delivery a domicilio" ? costoDeliveryLocal : 0;
  const total = subtotal + recargoDelivery;
  const totalUnidades = items.reduce((acc, item) => acc + item.cantidad, 0);

  return {
    subtotal,
    recargoDelivery,
    total,
    totalUnidades,
  };
}

/**
 * Construye el texto plano enriquecido con emojis para enviar a WhatsApp.
 */
export function formatWhatsAppMessage({
  local,
  items,
  datos,
}: WhatsAppOrderPayload): string {
  const { subtotal, recargoDelivery, total } = calcularTotalesCarrito(
    items,
    local.costoDelivery,
    datos.tipoEntrega
  );

  const emojiEntrega =
    datos.tipoEntrega === "Delivery a domicilio"
      ? "🛵"
      : datos.tipoEntrega === "Retiro en local"
      ? "🛍️"
      : "🍽️";

  const etiquetaUbicacion =
    datos.tipoEntrega === "Delivery a domicilio"
      ? "📍 *Dirección de entrega:*"
      : datos.tipoEntrega === "Consumo en mesa"
      ? "🪑 *Número de mesa:*"
      : "🏪 *Sucursal de retiro:*";

  const valorUbicacion =
    datos.tipoEntrega === "Retiro en local" && !datos.direccionOMesa.trim()
      ? `${local.nombre} (${local.ubicacion})`
      : datos.direccionOMesa.trim() || "Por confirmar";

  const detalleLineas = items
    .map(
      (item) =>
        `• *${item.cantidad}x* ${item.producto.nombre} — ${formatCLP(
          item.producto.precio * item.cantidad
        )} _(${formatCLP(item.producto.precio)} c/u)_`
    )
    .join("\n");

  const bloqueTotales =
    datos.tipoEntrega === "Delivery a domicilio"
      ? [
          `🧾 *Subtotal:* ${formatCLP(subtotal)}`,
          `🛵 *Delivery (${local.sector}):* ${
            recargoDelivery > 0 ? formatCLP(recargoDelivery) : "Gratis"
          }`,
          `💰 *TOTAL A PAGAR: ${formatCLP(total)}*`,
        ].join("\n")
      : `💰 *TOTAL A PAGAR: ${formatCLP(total)}*`;

  const lineasMensaje = [
    `🌊 *¡Hola ${local.nombre}!*`,
    `Te envío un nuevo pedido desde *PideTirúa* 📲`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🛒 *DETALLE DEL PEDIDO:*`,
    detalleLineas,
    `━━━━━━━━━━━━━━━━━━━━`,
    bloqueTotales,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Cliente:* ${datos.nombreCliente.trim()}`,
    `${emojiEntrega} *Modalidad:* ${datos.tipoEntrega}`,
    `${etiquetaUbicacion} ${valorUbicacion}`,
    `💳 *Método de pago:* ${datos.metodoPago}`,
  ];

  if (datos.notasAdicionales.trim()) {
    lineasMensaje.push(`📝 *Notas:* ${datos.notasAdicionales.trim()}`);
  }

  lineasMensaje.push(
    ``,
    `⏱️ _Quedo atento/a a la confirmación del pedido. ¡Muchas gracias!_`
  );

  return lineasMensaje.join("\n");
}

/**
 * Genera la URL oficial de WhatsApp (https://wa.me/{telefono_whatsapp}?text={mensaje_codificado})
 */
export function buildWhatsAppCheckoutUrl(payload: WhatsAppOrderPayload): string {
  const telefonoLimpio = payload.local.telefonoWhatsapp.replace(/\D/g, "");
  const mensaje = formatWhatsAppMessage(payload);
  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}`;
}
