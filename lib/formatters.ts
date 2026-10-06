import { DatosCheckout, ItemCarrito, Local, Producto } from "@/types/local";

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
 * Obtiene el precio efectivo a cobrar por un producto (aplica precio_oferta si es_oferta está activo).
 */
export function getPrecioEfectivoProducto(producto: Producto): number {
  if (
    producto.es_oferta &&
    typeof producto.precio_oferta === "number" &&
    producto.precio_oferta > 0
  ) {
    return producto.precio_oferta;
  }
  return producto.precio;
}

/**
 * Calcula subtotal y total general del pedido (sin costos de delivery).
 */
export function calcularTotalesCarrito(items: ItemCarrito[]) {
  const subtotal = items.reduce(
    (acc, item) =>
      acc + getPrecioEfectivoProducto(item.producto) * item.cantidad,
    0
  );
  const total = subtotal;
  const totalUnidades = items.reduce((acc, item) => acc + item.cantidad, 0);

  return {
    subtotal,
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
  const { total } = calcularTotalesCarrito(items);

  const emojiModalidad =
    datos.tipoEntrega === "Retiro en local" ? "🛍️" : "🍽️";

  const etiquetaUbicacion =
    datos.tipoEntrega === "Consumo en mesa"
      ? "🪑 *Número de mesa:*"
      : "🏪 *Sucursal de retiro:*";

  const valorUbicacion =
    datos.tipoEntrega === "Retiro en local" && !datos.direccionOMesa.trim()
      ? `${local.nombre} (${local.ubicacion})`
      : datos.direccionOMesa.trim() || "Por confirmar";

  const detalleLineas = items
    .map((item) => {
      const precioUnitario = getPrecioEfectivoProducto(item.producto);
      const enOferta =
        item.producto.es_oferta &&
        typeof item.producto.precio_oferta === "number" &&
        item.producto.precio_oferta > 0;
      const tagPromo = enOferta
        ? ` 🔥 _[PROMO: ${item.producto.texto_promo || "OFERTA"}]_`
        : "";
      return `• *${item.cantidad}x* ${item.producto.nombre}${tagPromo} — ${formatCLP(
        precioUnitario * item.cantidad
      )} _(${formatCLP(precioUnitario)} c/u)_`;
    })
    .join("\n");

  const lineasMensaje = [
    `🌊 *¡Hola ${local.nombre}!*`,
    `Te envío un nuevo pedido desde *PideTirúa* 📲`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🛒 *DETALLE DEL PEDIDO:*`,
    detalleLineas,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *TOTAL A PAGAR: ${formatCLP(total)}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Cliente:* ${datos.nombreCliente.trim()}`,
    ...(datos.telefonoCliente?.trim()
      ? [`📞 *Teléfono:* ${datos.telefonoCliente.trim()}`]
      : []),
    `${emojiModalidad} *Modalidad:* ${datos.tipoEntrega}`,
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
  const rawTel =
    payload.local.telefonoWhatsapp || payload.local.telefono_whatsapp || "";
  const telefonoLimpio = rawTel.replace(/\D/g, "");
  const mensaje = formatWhatsAppMessage(payload);
  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}`;
}
