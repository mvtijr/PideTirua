"use client";

import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Store,
  Utensils,
  User,
  Phone,
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
  Loader2,
  Clock,
  Pencil,
} from "lucide-react";
import {
  DatosCheckout,
  EstadoPedido,
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
  getPrecioEfectivoProducto,
  getPrecioUnitarioItem,
} from "@/lib/formatters";
import { getLocalTheme } from "@/lib/localTheme";

interface CartDrawerProps {
  abierto: boolean;
  onClose: () => void;
  local: Local;
  items: ItemCarrito[];
  onAgregar: (producto: Producto) => void;
  onIncrementarItem?: (item: ItemCarrito) => void;
  onDisminuir: (itemId: string) => void;
  onEditarItem?: (item: ItemCarrito) => void;
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

const LS_KEY_NOMBRE = "pidetirua_nombre";
const LS_KEY_DIRECCION = "pidetirua_direccion";
const LS_KEY_TELEFONO = "pidetirua_telefono";
const LS_KEY_ULTIMO_PEDIDO_PREFIX = "pidetirua_ultimo_pedido_";

export interface ItemPedidoConfirmado {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  opcionesTexto?: string;
}

export interface PedidoConfirmadoInfo {
  pedidoId?: string;
  codigoRetiro: string;
  estado: EstadoPedido;
  fecha: string;
  clienteNombre: string;
  clienteTelefono: string;
  tipoEntrega: string;
  direccionOMesa: string;
  horaRetiro: string;
  metodoPago: string;
  items: ItemPedidoConfirmado[];
  total: number;
  urlWhatsApp: string;
}

function reproducirTimbreListo() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const ahora = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ahora); // D5
    gain1.gain.setValueAtTime(0.2, ahora);
    gain1.gain.exponentialRampToValueAtTime(0.001, ahora + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ahora);
    osc1.stop(ahora + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ahora + 0.18); // A5
    gain2.gain.setValueAtTime(0.25, ahora + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, ahora + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ahora + 0.18);
    osc2.stop(ahora + 0.7);
  } catch {}
}

export default function CartDrawer({
  abierto,
  onClose,
  local,
  items,
  onAgregar,
  onIncrementarItem,
  onDisminuir,
  onEditarItem,
  onVaciar,
}: CartDrawerProps) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [tipoEntrega, setTipoEntrega] =
    useState<TipoEntrega>("Retiro en local");
  const [direccionOMesa, setDireccionOMesa] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("Efectivo");
  const [notasAdicionales, setNotasAdicionales] = useState("");
  const [horaRetiroTipo, setHoraRetiroTipo] = useState<"inmediato" | "programado">("inmediato");
  const [horaRetiroValor, setHoraRetiroValor] = useState("");
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [datosCopiados, setDatosCopiados] = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<PedidoConfirmadoInfo | null>(null);
  const [ultimoPedidoGuardado, setUltimoPedidoGuardado] = useState<PedidoConfirmadoInfo | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Cargar datos previamente guardados del cliente y último pedido desde localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const nombreGuardado = localStorage.getItem(LS_KEY_NOMBRE);
      const direccionGuardada = localStorage.getItem(LS_KEY_DIRECCION);
      const telefonoGuardado = localStorage.getItem(LS_KEY_TELEFONO);

      if (nombreGuardado) setNombreCliente(nombreGuardado);
      if (direccionGuardada) setDireccionOMesa(direccionGuardada);
      if (telefonoGuardado) setTelefonoCliente(telefonoGuardado);

      const rawUltimo = localStorage.getItem(
        `${LS_KEY_ULTIMO_PEDIDO_PREFIX}${local.slug}`
      );
      if (rawUltimo) {
        const parsed: PedidoConfirmadoInfo = JSON.parse(rawUltimo);
        const fecha = parsed.fecha ? new Date(parsed.fecha).getTime() : 0;
        // Relevante si es de las últimas 8 horas
        if (Date.now() - fecha < 8 * 60 * 60 * 1000) {
          setUltimoPedidoGuardado(parsed);
        }
      }
    } catch {
      // Ignorar errores de localStorage en modo privado
    }
  }, [local.slug, pedidoConfirmado]);

  // Polling en vivo para actualizar el estado del pedido con el monitor de cocina
  useEffect(() => {
    if (!pedidoConfirmado?.pedidoId) return;
    if (
      pedidoConfirmado.estado === "entregado" ||
      pedidoConfirmado.estado === "cancelado"
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pedidos/estado?id=${pedidoConfirmado.pedidoId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (
            data.ok &&
            data.estado &&
            data.estado !== pedidoConfirmado.estado
          ) {
            const nuevoEstado = data.estado as EstadoPedido;
            if (nuevoEstado === "listo") {
              reproducirTimbreListo();
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                try {
                  navigator.vibrate([200, 100, 200]);
                } catch {}
              }
            }

            setPedidoConfirmado((prev) => {
              if (!prev) return null;
              const actualizado = { ...prev, estado: nuevoEstado };
              try {
                localStorage.setItem(
                  `${LS_KEY_ULTIMO_PEDIDO_PREFIX}${local.slug}`,
                  JSON.stringify(actualizado)
                );
              } catch {}
              return actualizado;
            });
          }
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [pedidoConfirmado?.pedidoId, pedidoConfirmado?.estado, local.slug]);

  // Manejador de tecla Escape para cerrar el carrito
  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [abierto, onClose]);

  // Bloquear scroll del body cuando el carrito está abierto
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  if (!abierto || !isMounted) return null;

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

  const handleSeleccionarProgramado = () => {
    setHoraRetiroTipo("programado");
    if (!horaRetiroValor) {
      const ahora = new Date();
      ahora.setMinutes(ahora.getMinutes() + 35);
      const hh = String(ahora.getHours()).padStart(2, "0");
      const mm = String(ahora.getMinutes()).padStart(2, "0");
      setHoraRetiroValor(`${hh}:${mm}`);
    }
  };

  const datosCheckout: DatosCheckout = {
    nombreCliente,
    telefonoCliente,
    tipoEntrega,
    direccionOMesa,
    metodoPago,
    notasAdicionales,
    horaRetiroTipo,
    horaRetiroValor,
  };

  const { total, totalUnidades } = calcularTotalesCarrito(items);

  const placeholderUbicacion =
    tipoEntrega === "Consumo en mesa"
      ? "Ej: Mesa 4 (Terraza interior)"
      : "Ej: Retiro en 20 min / Retira Juan (opcional)";

  const labelUbicacion =
    tipoEntrega === "Consumo en mesa"
      ? "Número de mesa *"
      : "Hora o referencia para el retiro (opcional)";

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

    const telLimpio = telefonoCliente.replace(/\D/g, "");
    if (!telLimpio || telLimpio.length < 8) {
      setErrorValidacion(
        "Por favor ingresa un número de teléfono / WhatsApp válido (mínimo 8 dígitos) para notificarte cuando tu pedido esté listo."
      );
      return;
    }

    if (tipoEntrega === "Consumo en mesa" && !direccionOMesa.trim()) {
      setErrorValidacion("Por favor indica tu número de mesa.");
      return;
    }

    setErrorValidacion(null);

    // Guardar datos ingresados en localStorage para próximos pedidos
    try {
      localStorage.setItem(LS_KEY_NOMBRE, nombreCliente.trim());
      if (direccionOMesa.trim()) {
        localStorage.setItem(LS_KEY_DIRECCION, direccionOMesa.trim());
      }
      localStorage.setItem(LS_KEY_TELEFONO, telefonoCliente.trim());
    } catch {
      // Ignorar errores de escritura en localStorage
    }

    const horaRetiroFinal =
      horaRetiroTipo === "programado" && horaRetiroValor.trim()
        ? horaRetiroValor.trim()
        : "lo_antes_posible";

    const notasCompletas = [
      telefonoCliente.trim() ? `Tel: ${telefonoCliente.trim()}` : "",
      horaRetiroTipo === "programado" && horaRetiroValor.trim()
        ? `Retiro programado: ${horaRetiroValor.trim()} hrs`
        : "",
      notasAdicionales.trim(),
    ]
      .filter(Boolean)
      .join(" | ");

    const payloadPedido = {
      local_slug: local.slug,
      cliente_nombre: nombreCliente.trim(),
      cliente_telefono: telefonoCliente.trim() || undefined,
      hora_retiro: horaRetiroFinal,
      tipo_entrega: tipoEntrega === "Consumo en mesa" ? "Mesa" : "Retiro",
      direccion_mesa:
        direccionOMesa.trim() ||
        (tipoEntrega === "Consumo en mesa"
          ? "Mesa en salón"
          : `${local.nombre} (${local.ubicacion})`),
      metodo_pago:
        metodoPago === "Transferencia Bancaria" ? "Transferencia" : "Efectivo",
      notas: notasCompletas,
      items: items.map((item) => {
        const precioUnitario = getPrecioUnitarioItem(item);
        return {
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio: precioUnitario,
          subtotal: precioUnitario * item.cantidad,
          opciones: item.opcionesSeleccionadas || [],
        };
      }),
      total,
    };

    const url = buildWhatsAppCheckoutUrl({
      local,
      items,
      datos: datosCheckout,
    });

    if (enviandoPedido) return;
    setEnviandoPedido(true);

    // Timeout de resiliencia de máximo 3.5 segundos con AbortController para 4G rural inestable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        controller.abort();
      } catch {}
    }, 3500);

    let codigoGenerado = `TR-${Date.now().toString().slice(-4)}`;
    let pedidoIdRetornado: string | undefined = undefined;
    try {
      const resp = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        signal: controller.signal,
        body: JSON.stringify(payloadPedido),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.ok && data.pedido?.id) {
          pedidoIdRetornado = data.pedido.id;
          codigoGenerado = `TR-${data.pedido.id.slice(-4).toUpperCase()}`;
        }
      }
    } catch {
      // Si la llamada a Supabase falla o supera los 3.5s (por señal 4G inestable),
      // se captura el error en silencio y se ABRE WHATSAPP DE TODAS FORMAS.
      // El cliente nunca debe quedarse bloqueado sin poder enviar su comanda.
    } finally {
      clearTimeout(timeoutId);
    }

    const infoConfirmacion: PedidoConfirmadoInfo = {
      pedidoId: pedidoIdRetornado,
      codigoRetiro: codigoGenerado,
      estado: "pendiente",
      fecha: new Date().toISOString(),
      clienteNombre: nombreCliente.trim(),
      clienteTelefono: telefonoCliente.trim(),
      tipoEntrega,
      direccionOMesa:
        direccionOMesa.trim() ||
        (tipoEntrega === "Consumo en mesa"
          ? "Mesa en salón"
          : `${local.nombre} (${local.ubicacion})`),
      horaRetiro:
        horaRetiroFinal === "lo_antes_posible"
          ? `Lo antes posible (~${local.tiempo_estimado || "20-30 min"})`
          : `Retiro a las ${horaRetiroFinal} hrs`,
      metodoPago:
        metodoPago === "Transferencia Bancaria" ? "Transferencia" : "Efectivo",
      items: items.map((item) => {
        const precioUnitario = getPrecioUnitarioItem(item);
        return {
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precioUnitario,
          subtotal: precioUnitario * item.cantidad,
          opcionesTexto: item.opcionesSeleccionadas?.length
            ? item.opcionesSeleccionadas
                .map((op) =>
                  op.precio > 0
                    ? `${op.nombre} (+${formatCLP(op.precio)})`
                    : op.nombre
                )
                .join(", ")
            : undefined,
        };
      }),
      total,
      urlWhatsApp: url,
    };

    try {
      localStorage.setItem(
        `${LS_KEY_ULTIMO_PEDIDO_PREFIX}${local.slug}`,
        JSON.stringify(infoConfirmacion)
      );
    } catch {
      // Ignorar error de almacenamiento
    }

    // Intentar abrir WhatsApp en ventana emergente/pestaña
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // En navegadores con bloqueo estricto, el botón directo de la pantalla de confirmación lo abre
    }

    // Transicionar a la pantalla de confirmación con el recibo y vaciar el carrito
    setPedidoConfirmado(infoConfirmacion);
    setEnviandoPedido(false);
    onVaciar();
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      {/* Panel lateral / Drawer mobile-first */}
      <div
        className="flex h-full w-full max-w-lg flex-col bg-[#FAF8F5] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Drawer */}
        <div
          className={`flex items-center justify-between border-b px-4 py-4 sm:px-6 ${theme.drawerHeader}`}
        >
          <div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${theme.drawerHeaderSub}`}
            >
              {pedidoConfirmado
                ? `Comanda Registrada • #${pedidoConfirmado.codigoRetiro}`
                : "Pedido directo a WhatsApp"}
            </span>
            <h2
              id="cart-drawer-title"
              className="font-display text-2xl tracking-wide uppercase leading-tight text-stone-900"
            >
              {pedidoConfirmado
                ? `Comanda en ${local.nombre}`
                : `Tu Pedido en ${local.nombre}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (pedidoConfirmado) {
                setPedidoConfirmado(null);
              }
              onClose();
            }}
            className={`rounded-full p-2 transition ${theme.drawerCloseBtn}`}
            aria-label="Cerrar carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PANTALLA POST-CHECKOUT: CONFIRMACIÓN Y RECIBO DE COMANDA */}
        {pedidoConfirmado ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
              {/* Header de Éxito */}
              <div className="text-center space-y-1.5 pt-1">
                <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  ✓ Comanda Registrada con Éxito
                </span>
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-stone-900 leading-tight">
                  ¡Tu pedido está en cocina!
                </h3>
                <p className="font-body text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                  El equipo de <strong>{local.nombre}</strong> ya tiene tu orden en el monitor de cocina.
                </p>
              </div>

              {/* Tarjeta Destacada con Código de Retiro */}
              <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/90 p-4 text-center space-y-1 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900">
                  Código de Identificación / Retiro
                </span>
                <div className="font-display text-3xl sm:text-4xl font-black tracking-widest text-stone-950 tabular-nums">
                  #{pedidoConfirmado.codigoRetiro}
                </div>
                <p className="text-[11px] text-amber-900 font-medium">
                  Muestra este código al retirar en el local o en tu mesa.
                </p>
              </div>

              {/* Stepper Visual de Estado en Vivo (Sincronizado con Monitor de Cocina) */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                    Estado en Cocina
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider tabular-nums ${
                      pedidoConfirmado.estado === "listo"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse"
                        : pedidoConfirmado.estado === "preparando"
                        ? "bg-orange-100 text-[#EA580C] border border-orange-200"
                        : pedidoConfirmado.estado === "entregado"
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : "bg-amber-100 text-amber-900 border border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        pedidoConfirmado.estado === "listo"
                          ? "bg-emerald-600"
                          : pedidoConfirmado.estado === "preparando"
                          ? "bg-[#EA580C] animate-ping"
                          : "bg-amber-600"
                      }`}
                    />
                    <span>
                      {pedidoConfirmado.estado === "listo"
                        ? "¡Listo para retirar!"
                        : pedidoConfirmado.estado === "preparando"
                        ? "En preparación"
                        : pedidoConfirmado.estado === "entregado"
                        ? "Entregado"
                        : "Recibido en cocina"}
                    </span>
                  </span>
                </div>

                {/* 3 Fases del Pedido */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div
                    className={`p-2 rounded-xl border transition-all ${
                      ["pendiente", "preparando", "listo", "entregado"].includes(
                        pedidoConfirmado.estado
                      )
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-bold"
                        : "border-stone-200 bg-stone-50 text-stone-400"
                    }`}
                  >
                    <span className="block text-base">⏳</span>
                    <span className="text-[10px] uppercase tracking-wider block mt-0.5">
                      Recibido
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-xl border transition-all ${
                      ["preparando", "listo", "entregado"].includes(
                        pedidoConfirmado.estado
                      )
                        ? "border-orange-300 bg-orange-50 text-orange-950 font-bold"
                        : "border-stone-200 bg-stone-50 text-stone-400"
                    }`}
                  >
                    <span className="block text-base">🔥</span>
                    <span className="text-[10px] uppercase tracking-wider block mt-0.5">
                      En Cocina
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-xl border transition-all ${
                      ["listo", "entregado"].includes(pedidoConfirmado.estado)
                        ? "border-emerald-500 bg-emerald-600 text-white font-black shadow-sm"
                        : "border-stone-200 bg-stone-50 text-stone-400"
                    }`}
                  >
                    <span className="block text-base">🎉</span>
                    <span className="text-[10px] uppercase tracking-wider block mt-0.5">
                      ¡Listo!
                    </span>
                  </div>
                </div>

                {pedidoConfirmado.estado === "listo" && (
                  <div className="rounded-xl bg-emerald-600 text-white p-3 text-center text-xs font-bold shadow-md animate-in fade-in zoom-in-95 duration-300">
                    🔔 ¡Tu comanda está lista y caliente! Pasa al mostrador o a tu mesa con el código #{pedidoConfirmado.codigoRetiro}.
                  </div>
                )}
              </div>

              {/* Botón Destacado de Auxilio / Reintento de WhatsApp */}
              <div className="space-y-1.5">
                <a
                  href={pedidoConfirmado.urlWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-4 font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5 shrink-0 fill-white" />
                  <span>📲 Abrir comanda en WhatsApp</span>
                </a>
                <p className="text-center text-[11px] text-stone-500 leading-relaxed">
                  ¿Se cerró la ventana? Presiona el botón verde para enviar o revisar el mensaje directo con el restaurante.
                </p>
              </div>

              {/* Detalles de Retiro / Entrega */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 space-y-2.5 shadow-xs text-xs text-stone-800">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="font-bold text-stone-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#EA580C]" />
                    Horario de Retiro
                  </span>
                  <span className="font-black text-stone-900 tabular-nums">
                    {pedidoConfirmado.horaRetiro}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="font-bold text-stone-500 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-stone-600" />
                    Modalidad
                  </span>
                  <span className="font-bold text-stone-900">
                    {pedidoConfirmado.tipoEntrega}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="font-bold text-stone-500 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-stone-600" />
                    Referencia / Ubicación
                  </span>
                  <span className="font-medium text-stone-900 text-right truncate max-w-[200px]">
                    {pedidoConfirmado.direccionOMesa}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-500 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-stone-600" />
                    Teléfono registrado
                  </span>
                  <span className="font-bold text-emerald-700 tabular-nums">
                    {pedidoConfirmado.clienteTelefono}
                  </span>
                </div>
              </div>

              {/* Resumen de Productos */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 space-y-2 shadow-xs">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-1.5">
                  Resumen del Pedido ({pedidoConfirmado.items.length} platos)
                </h4>
                <div className="divide-y divide-stone-100 text-xs">
                  {pedidoConfirmado.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-stone-900">
                          {it.cantidad}x {it.nombre}
                        </span>
                        {it.opcionesTexto && (
                          <span className="block text-[11px] text-stone-500 italic mt-0.5">
                            Extras: [{it.opcionesTexto}]
                          </span>
                        )}
                      </div>
                      <span className="font-black text-stone-900 shrink-0 tabular-nums">
                        {formatCLP(it.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200 pt-2 flex items-center justify-between">
                  <span className="font-display text-base uppercase text-stone-900">
                    Total a Pagar
                  </span>
                  <span className="font-display text-2xl font-black text-[#EA580C] tabular-nums">
                    {formatCLP(pedidoConfirmado.total)}
                  </span>
                </div>
              </div>

              {/* Si pagó con Transferencia Bancaria, mostrar CuentaRUT con botón de copiado */}
              {pedidoConfirmado.metodoPago === "Transferencia" && tieneDatosBancarios && (
                <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/70 p-4 text-slate-900 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                      <Landmark className="h-4 w-4 text-emerald-700" />
                      Datos para Transferir (CuentaRUT)
                    </span>
                    <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                      Directo
                    </span>
                  </div>

                  <dl className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                    {local.banco && (
                      <div className="bg-white/85 p-2 rounded-lg">
                        <dt className="text-[10px] font-bold uppercase text-slate-500">Banco</dt>
                        <dd className="font-bold text-slate-900">{local.banco}</dd>
                      </div>
                    )}
                    {local.tipo_cuenta && (
                      <div className="bg-white/85 p-2 rounded-lg">
                        <dt className="text-[10px] font-bold uppercase text-slate-500">Tipo de cuenta</dt>
                        <dd className="font-bold text-slate-900">{local.tipo_cuenta}</dd>
                      </div>
                    )}
                    {local.numero_cuenta && (
                      <div className="bg-white/85 p-2 rounded-lg">
                        <dt className="text-[10px] font-bold uppercase text-slate-500">N° de cuenta</dt>
                        <dd className="font-black text-slate-900 tabular-nums">{local.numero_cuenta}</dd>
                      </div>
                    )}
                    {local.rut_titular && (
                      <div className="bg-white/85 p-2 rounded-lg">
                        <dt className="text-[10px] font-bold uppercase text-slate-500">RUT</dt>
                        <dd className="font-black text-slate-900 tabular-nums">{local.rut_titular}</dd>
                      </div>
                    )}
                    {local.nombre_titular && (
                      <div className="bg-white/85 p-2 rounded-lg sm:col-span-2">
                        <dt className="text-[10px] font-bold uppercase text-slate-500">Titular</dt>
                        <dd className="font-bold text-slate-900">{local.nombre_titular}</dd>
                      </div>
                    )}
                  </dl>

                  <button
                    type="button"
                    onClick={handleCopiarDatosBancarios}
                    className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-extrabold shadow-xs transition active:scale-[0.99] ${
                      datosCopiados
                        ? "border-emerald-600 bg-emerald-700 text-white"
                        : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {datosCopiados ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>✓ ¡Datos bancarios copiados!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 shrink-0" />
                        <span>📋 Copiar datos de transferencia</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-emerald-900 text-center font-medium">
                    Envía el comprobante al chat de WhatsApp al realizar el pago.
                  </p>
                </div>
              )}
            </div>

            {/* Pie con botón para volver a la carta */}
            <div className="border-t border-stone-200/90 bg-white p-4 sm:px-6 safe-bottom">
              <button
                type="button"
                onClick={() => {
                  setPedidoConfirmado(null);
                  onClose();
                }}
                className="w-full rounded-full bg-[#18181B] hover:bg-[#EA580C] text-white py-3 text-xs font-black uppercase tracking-wider transition shadow-sm"
              >
                ✓ Entendido, volver a la carta
              </button>
            </div>
          </div>
        ) : (
        /* Contenido scrollable del formulario de checkout */
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
                <div className="space-y-4">
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500 shadow-xs">
                    Tu carrito está vacío. Agrega platos de la carta para armar tu
                    pedido.
                  </div>

                  {ultimoPedidoGuardado && (
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                          Última comanda registrada
                        </span>
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900 tabular-nums">
                          #{ultimoPedidoGuardado.codigoRetiro}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700">
                        {ultimoPedidoGuardado.items.length}{" "}
                        {ultimoPedidoGuardado.items.length === 1
                          ? "producto"
                          : "productos"}{" "}
                        • {formatCLP(ultimoPedidoGuardado.total)} (
                        {ultimoPedidoGuardado.horaRetiro})
                      </p>
                      <button
                        type="button"
                        onClick={() => setPedidoConfirmado(ultimoPedidoGuardado)}
                        className="w-full rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#EA580C]" />
                        <span>Ver recibo y estado de comanda</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`divide-y rounded-2xl border ${theme.drawerItemsBox}`}
                >
                  {items.map((item) => {
                    const { producto, cantidad, opcionesSeleccionadas } = item;
                    const itemKey = item.id || producto.id;
                    const precioUnitario = getPrecioUnitarioItem(item);
                    const esPromo =
                      producto.es_oferta &&
                      typeof producto.precio_oferta === "number" &&
                      producto.precio_oferta > 0 &&
                      producto.precio_oferta < producto.precio;

                    return (
                      <div
                        key={itemKey}
                        className="flex items-center justify-between gap-3 p-3.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm font-bold ${theme.drawerItemTitle}`}
                          >
                            {producto.nombre}
                          </p>

                          {opcionesSeleccionadas && opcionesSeleccionadas.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {opcionesSeleccionadas.map((op, opIdx) => (
                                <span
                                  key={opIdx}
                                  className="inline-flex items-center rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-700 border border-stone-200"
                                >
                                  {op.nombre}
                                  {op.precio > 0 ? ` (+${formatCLP(op.precio)})` : ""}
                                </span>
                              ))}
                            </div>
                          )}

                          {producto.opciones && producto.opciones.length > 0 && onEditarItem && (
                            <div className="mt-1.5">
                              <button
                                type="button"
                                onClick={() => onEditarItem(item)}
                                className="inline-flex items-center gap-1 rounded-md bg-orange-50 hover:bg-orange-100 text-[#EA580C] px-2 py-0.5 text-[10px] font-bold transition active:scale-95"
                                title="Modificar salsas o agregados de este plato"
                              >
                                <Pencil className="h-2.5 w-2.5" />
                                <span>Modificar extras / salsas</span>
                              </button>
                            </div>
                          )}

                          <p className="mt-0.5 text-xs font-medium text-on-surface-variant tabular-nums">
                            {esPromo && (
                              <span className="mr-1 text-[11px] text-slate-400 line-through">
                                {formatCLP(producto.precio)}
                              </span>
                            )}
                            <span className={esPromo ? "font-bold text-rose-600" : ""}>
                              {formatCLP(precioUnitario)} c/u
                            </span>{" "}
                            ·{" "}
                            <strong className={theme.drawerItemTotal}>
                              {formatCLP(precioUnitario * cantidad)}
                            </strong>
                          </p>
                        </div>

                        <div
                          className={`flex items-center gap-2 rounded-xl border bg-white p-1 shadow-2xs ${theme.cardCounterBox}`}
                        >
                          <button
                            type="button"
                            onClick={() => onDisminuir(itemKey)}
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
                            onClick={() =>
                              onIncrementarItem
                                ? onIncrementarItem(item)
                                : onAgregar(producto)
                            }
                            className={`flex h-7 w-7 items-center justify-center rounded-lg active:scale-95 ${theme.cardPlusBtn}`}
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  className="w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 shadow-xs"
                />
              </div>

              {/* Teléfono de contacto / WhatsApp (obligatorio) */}
              <div>
                <label
                  htmlFor="telefonoCliente"
                  className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold ${theme.drawerLabel}`}
                >
                  <Phone className={`h-3.5 w-3.5 ${theme.drawerLabelIcon}`} />
                  Teléfono / WhatsApp *
                </label>
                <input
                  id="telefonoCliente"
                  type="tel"
                  required
                  value={telefonoCliente}
                  onChange={(e) => {
                    setTelefonoCliente(e.target.value);
                    if (errorValidacion) setErrorValidacion(null);
                  }}
                  placeholder="Ej: +56 9 8765 4321 o 987654321"
                  className="w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 shadow-xs"
                />
                <p className="mt-1 text-[11px] text-stone-500">
                  El local usará este número para avisarte por WhatsApp en el momento exacto en que tu pedido esté listo para retirar.
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <span>✓ Tus datos quedan guardados en tu celular para tus próximos pedidos</span>
                </p>
              </div>

              {/* Programación de Hora de Retiro */}
              <div className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${theme.drawerLabel}`}>
                    <Clock className={`h-3.5 w-3.5 ${theme.drawerLabelIcon}`} />
                    ¿Cuándo pasas a retirar tu pedido?
                  </span>
                  {horaRetiroTipo === "inmediato" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-300">
                      ~{local.tiempo_estimado || "20-30 min"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHoraRetiroTipo("inmediato")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-black transition active:scale-[0.98] ${
                      horaRetiroTipo === "inmediato"
                        ? "border-[#EA580C] bg-[#EA580C] text-white shadow-xs"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <span>⚡ Lo antes posible</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSeleccionarProgramado}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-black transition active:scale-[0.98] ${
                      horaRetiroTipo === "programado"
                        ? "border-[#EA580C] bg-[#EA580C] text-white shadow-xs"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <span>🕒 Programar hora</span>
                  </button>
                </div>

                {horaRetiroTipo === "programado" && (
                  <div className="pt-1 space-y-1.5">
                    <label htmlFor="horaRetiroInput" className="sr-only">
                      Hora estimada de retiro
                    </label>
                    <input
                      id="horaRetiroInput"
                      type="time"
                      value={horaRetiroValor}
                      onChange={(e) => setHoraRetiroValor(e.target.value)}
                      className="w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 font-mono text-base sm:text-sm font-bold text-stone-900 shadow-xs focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                    />
                    <p className="text-[11px] font-medium text-stone-500">
                      Indica la hora aproximada en que vendrás a buscar tu comida
                    </p>
                  </div>
                )}
              </div>

              {/* Mesa o Referencia para Retiro */}
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
                  className="w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 shadow-xs"
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
                  className="w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 shadow-xs"
                />
              </div>
            </div>

            {/* Vista previa opcional del mensaje de WhatsApp */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-xs">
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
                  className={`mt-2.5 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl p-3 font-mono text-[11px] leading-relaxed ${theme.drawerPreviewBox}`}
                >
                  {mensajePrevia}
                </pre>
              )}
            </div>

            {errorValidacion && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorValidacion}</span>
              </div>
            )}
          </div>

          {/* Resumen de Total y Botón de Checkout a WhatsApp */}
          <div className="border-t border-stone-200/90 bg-white p-4 sm:px-6 safe-bottom">
            <div
              className={`mb-3 flex items-center justify-between text-base font-extrabold ${theme.drawerLabel}`}
            >
              <span>Total a pagar</span>
              <span className={`text-xl tabular-nums ${theme.drawerItemTotal}`}>
                {formatCLP(total)}
              </span>
            </div>

            <button
              type="submit"
              disabled={
                enviandoPedido ||
                !local.abierto ||
                local.activo === false ||
                items.length === 0
              }
              className="flex w-full min-h-[56px] items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-5 py-4 text-base font-extrabold uppercase tracking-wide text-white shadow-lg shadow-[#25D366]/25 transition hover:bg-[#20bd5a] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:opacity-65 disabled:shadow-none"
            >
              {enviandoPedido ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span>Enviando pedido a WhatsApp...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="h-5 w-5 fill-white" />
                  <span>
                    {local.activo === false
                      ? "Servicio Suspendido"
                      : local.abierto
                      ? "Enviar pedido a WhatsApp"
                      : "Local Cerrado por ahora"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
