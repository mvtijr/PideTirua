import { DatosCheckout, ItemCarrito, Local, Producto } from "@/types/local";

/**
 * Formatea un número como Peso Chileno ($ CLP con puntos de miles, ej: $12.500).
 * Implementación determinista para evitar diferencias de hidratación SSR/CSR.
 */
export function formatCLP(monto: number): string {
  const num = typeof monto === "number" && !isNaN(monto) ? monto : 0;
  const entero = Math.round(num);
  const conPuntos = entero
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${conPuntos}`;
}

/**
 * Formatea un teléfono chileno 569XXXXXXXX para lectura humana (+56 9 XXXX XXXX).
 */
export function formatPhoneDisplay(telefono?: string): string {
  if (!telefono) return "";
  const limpio = String(telefono).replace(/\D/g, "");
  if (limpio.length === 11 && limpio.startsWith("569")) {
    return `+56 9 ${limpio.slice(3, 7)} ${limpio.slice(7)}`;
  }
  return limpio ? `+${limpio}` : "";
}

interface WhatsAppOrderPayload {
  local: Local;
  items: ItemCarrito[];
  datos: DatosCheckout;
  codigoRetiro?: string;
}

/**
 * Retorna la fecha actual en Chile (zona horaria America/Santiago) en formato YYYY-MM-DD.
 */
export function getFechaHoyChile(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Determina si una oferta del día está activa y vigente exclusivamente para la fecha de hoy.
 * Si fue configurada en una fecha previa o expiró, retorna false para que vuelva a su precio normal.
 */
export function esOfertaValidaHoy(producto: Producto): boolean {
  if (!producto.es_oferta || producto.disponible === false) return false;
  const hoy = getFechaHoyChile();
  if (producto.fecha_oferta) {
    return producto.fecha_oferta === hoy;
  }
  return true;
}

/**
 * Obtiene el precio efectivo a cobrar por un producto (aplica precio_oferta si la oferta del día está activa hoy).
 */
export function getPrecioEfectivoProducto(producto: Producto): number {
  if (
    esOfertaValidaHoy(producto) &&
    typeof producto.precio_oferta === "number" &&
    producto.precio_oferta > 0
  ) {
    return producto.precio_oferta;
  }
  return producto.precio;
}

/**
 * Obtiene el precio unitario total de un ítem en el carrito, sumando el precio
 * base/oferta del plato más todos los extras/modificadores seleccionados.
 */
export function getPrecioUnitarioItem(item: ItemCarrito): number {
  if (typeof item.precioUnitarioFinal === "number" && item.precioUnitarioFinal > 0) {
    return item.precioUnitarioFinal;
  }
  const base = getPrecioEfectivoProducto(item.producto);
  const extras = (item.opcionesSeleccionadas || []).reduce(
    (acc, op) => acc + (Number(op.precio) || 0),
    0
  );
  return base + extras;
}

/**
 * Calcula subtotal y total general del pedido (para retiro en local o consumo en mesa).
 */
export function calcularTotalesCarrito(items: ItemCarrito[] = []) {
  const lista = Array.isArray(items) ? items : [];
  const subtotal = lista.reduce(
    (acc, item) =>
      acc + getPrecioUnitarioItem(item) * (Number(item?.cantidad) || 1),
    0
  );
  const total = subtotal;
  const totalUnidades = lista.reduce(
    (acc, item) => acc + (Number(item?.cantidad) || 1),
    0
  );

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
  codigoRetiro,
}: WhatsAppOrderPayload): string {
  const { total } = calcularTotalesCarrito(items);

  const emojiModalidad =
    datos.tipoEntrega === "Retiro en local" ? "🛍️" : "🍽️";

  const textoModalidad =
    datos.tipoEntrega === "Retiro en local"
      ? "Retiro al paso en mostrador (para llevar, sin delivery)"
      : "Servirse en el local (pedido anticipado / en mesa, sin delivery)";

  const etiquetaUbicacion =
    datos.tipoEntrega === "Consumo en mesa"
      ? "🪑 *Mesa o aviso de llegada:*"
      : "🏪 *Sucursal de retiro:*";

  const valorUbicacion =
    datos.tipoEntrega === "Retiro en local" && !(datos.direccionOMesa || "").trim()
      ? `${local.nombre} (${local.ubicacion})`
      : (datos.direccionOMesa || "").trim() || "Por confirmar";

  const detalleLineas = items
    .map((item) => {
      const precioUnitario = getPrecioUnitarioItem(item);
      const enOferta =
        item.producto.es_oferta &&
        typeof item.producto.precio_oferta === "number" &&
        item.producto.precio_oferta > 0;
      const tagPromo = enOferta
        ? ` 🔥 _[PROMO: ${item.producto.texto_promo || "OFERTA"}]_`
        : "";
      
      let linea = `• *${item.cantidad}x* ${item.producto.nombre}${tagPromo} — ${formatCLP(
        precioUnitario * item.cantidad
      )} _(${formatCLP(precioUnitario)} c/u)_`;

      if (item.opcionesSeleccionadas && item.opcionesSeleccionadas.length > 0) {
        const extrasTexto = item.opcionesSeleccionadas
          .map((op) =>
            op.precio > 0
              ? `${op.nombre} (+${formatCLP(op.precio)})`
              : op.nombre
          )
          .join(", ");
        linea += `\n   ↳ _Extras: [${extrasTexto}]_`;
      }

      return linea;
    })
    .join("\n");

  const tiempoEstimadoLocal = local.tiempo_estimado?.trim() || "20-30 min";
  const lineaHorario =
    datos.horaRetiroTipo === "programado" && datos.horaRetiroValor?.trim()
      ? `⏰ *Horario programado:* Retiro a las ${datos.horaRetiroValor.trim()} hrs`
      : `🕒 *Horario:* Lo antes posible (${tiempoEstimadoLocal})`;

  const lineasMensaje = [
    `🌊 *¡Hola ${local.nombre}!*`,
    `Te envío un nuevo pedido desde *PideTirúa* 📲`,
    ...(codigoRetiro
      ? [`🔖 *CÓDIGO DE RETIRO: #${codigoRetiro.replace(/^#/, "")}*`]
      : []),
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🛒 *DETALLE DEL PEDIDO:*`,
    detalleLineas,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *TOTAL A PAGAR: ${formatCLP(total)}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Cliente:* ${(datos.nombreCliente || "").trim()}`,
    ...((datos.telefonoCliente || "").trim()
      ? [`📞 *Teléfono:* ${(datos.telefonoCliente || "").trim()}`]
      : []),
    `${emojiModalidad} *Modalidad:* ${textoModalidad}`,
    lineaHorario,
    `${etiquetaUbicacion} ${valorUbicacion}`,
    `💳 *Método de pago:* ${datos.metodoPago}`,
    ...(datos.metodoPago === "Transferencia Bancaria"
      ? [
          `📎 *Comprobante:* Adjunto foto o voucher de la transferencia aquí abajo 👇`,
        ]
      : []),
    `🕒 *Hora de pedido:* ${new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago", hour: "2-digit", minute: "2-digit", hour12: false })} hrs`,
    `♨️ *Garantía de frescura:* Retirar dentro de los 15-20 min posteriores al aviso de 'Listo'`,
  ];

  if ((datos.notasAdicionales || "").trim()) {
    lineasMensaje.push(`📝 *Notas:* ${(datos.notasAdicionales || "").trim()}`);
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
    payload.local?.telefonoWhatsapp || payload.local?.telefono_whatsapp || "";
  const telefonoLimpio = String(rawTel).replace(/\D/g, "");
  const mensaje = formatWhatsAppMessage(payload);
  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}`;
}

/**
 * Determina si la cocina está en su última media hora antes del cierre ("Last Call").
 */
export function estaEnUltimaLlamadaCocina(horarioStr?: string): boolean {
  if (!horarioStr) return false;
  try {
    const match = horarioStr.match(/(?:a|-)\s*(\d{1,2}):(\d{2})/i);
    if (!match) return false;
    const horaCierre = parseInt(match[1], 10);
    const minCierre = parseInt(match[2], 10);

    const ahora = new Date();
    const chileFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santiago",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const partes = chileFormatter.formatToParts(ahora);
    const horaActual = parseInt(partes.find((p) => p.type === "hour")?.value || "0", 10);
    const minActual = parseInt(partes.find((p) => p.type === "minute")?.value || "0", 10);

    const minutosAhora = horaActual * 60 + minActual;
    const minutosCierre = horaCierre * 60 + minCierre;

    const diferencia = minutosCierre - minutosAhora;
    return diferencia > 0 && diferencia <= 35;
  } catch {
    return false;
  }
}
