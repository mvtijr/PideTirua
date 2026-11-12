import { NextRequest, NextResponse } from "next/server";
import {
  actualizarEstadoPedidoEnSupabase,
  crearPedidoEnSupabase,
  listarPedidosPorLocalEnSupabase,
  obtenerPedidoPorIdEnSupabase,
} from "@/lib/pedidos";
import { fetchLocalBySlug, stripSensitiveLocalFields } from "@/lib/locales";
import { getPrecioEfectivoProducto } from "@/lib/formatters";
import {
  EstadoPedido,
  ItemPedidoGuardado,
  OpcionSeleccionada,
  Producto,
} from "@/types/local";
import {
  addPhoneToBlacklist,
  checkRateLimit,
  getClientIp,
  isKdsAuthorized,
  isPhoneBlacklisted,
  isSuperAdminAuthorized,
  normalizePhone,
  recordFailedAttempt,
  sanitizeString,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const localSlug = req.nextUrl.searchParams.get("local_slug") || "";
  const slugLimpio = localSlug.trim().toLowerCase();
  if (!slugLimpio) {
    return NextResponse.json(
      { ok: false, error: "Falta el parámetro local_slug" },
      { status: 400 }
    );
  }

  // PROTECCIÓN DE SEGURIDAD Y PRIVACIDAD DE DATOS:
  // Solo sesión HMAC válida del dueño del local, cocina KDS del mismo slug o SuperAdmin
  if (!isKdsAuthorized(req.cookies, slugLimpio)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Acceso denegado: debes iniciar sesión en el panel del local o monitor de pedidos para consultar comandas.",
      },
      { status: 401 }
    );
  }

  const pedidos = await listarPedidosPorLocalEnSupabase(slugLimpio);
  const includeMenu = req.nextUrl.searchParams.get("include_menu") === "1";

  if (includeMenu) {
    const local = await fetchLocalBySlug(slugLimpio);
    const safeLocal = local ? stripSensitiveLocalFields(local) : undefined;
    const categorias = Array.isArray(safeLocal?.categorias)
      ? safeLocal.categorias
      : [];
    return NextResponse.json(
      { ok: true, pedidos, categorias },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true, pedidos },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimitStatus = checkRateLimit(
      `checkout:${ip}`,
      5,
      10 * 60 * 1000,
      10 * 60 * 1000
    );

    if (!rateLimitStatus.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Has alcanzado el límite de 5 pedidos consecutivos desde esta conexión. Por favor espera unos minutos antes de volver a ordenar.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      local_slug,
      cliente_nombre,
      cliente_telefono,
      hora_retiro,
      tipo_entrega,
      direccion_mesa,
      metodo_pago,
      notas,
      items,
    } = body;

    const slugLimpio = sanitizeString(local_slug, 50).toLowerCase();
    if (!slugLimpio) {
      return NextResponse.json(
        { ok: false, error: "local_slug es requerido" },
        { status: 400 }
      );
    }

    const local = await fetchLocalBySlug(slugLimpio, true);
    if (!local) {
      return NextResponse.json(
        { ok: false, error: "Este local no existe o no se encuentra activo." },
        { status: 404 }
      );
    }

    const productosById = new Map<string, Producto>();
    const productosByNombre = new Map<string, Producto>();
    for (const cat of local.categorias || []) {
      for (const prod of cat.productos || []) {
        if (prod.id) productosById.set(prod.id, prod);
        if (prod.nombre) {
          productosByNombre.set(prod.nombre.trim().toLowerCase(), prod);
        }
      }
    }

    const rawItems = Array.isArray(items) ? items.slice(0, 50) : [];
    const itemsLimpios: ItemPedidoGuardado[] = [];

    for (const rawIt of rawItems) {
      const it = (rawIt || {}) as Record<string, unknown>;
      const cantidad = Math.max(1, Math.min(99, Math.round(Number(it.cantidad) || 1)));
      const productoId =
        typeof it.productoId === "string" ? it.productoId.trim() : "";
      const nombreLimpio = sanitizeString(it.nombre, 80);

      const prodServer =
        (productoId && productosById.get(productoId)) ||
        (nombreLimpio && productosByNombre.get(nombreLimpio.toLowerCase())) ||
        undefined;

      if (!prodServer) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Uno de los productos del carrito ya no está en la carta actualizada. Recarga el menú antes de enviar tu pedido.",
          },
          { status: 400 }
        );
      }

      const opcionesLimpias: OpcionSeleccionada[] = [];
      let extrasUnitarios = 0;

      if (Array.isArray(it.opciones) && Array.isArray(prodServer.opciones)) {
        for (const rawOp of it.opciones.slice(0, 20)) {
          const opObj = (rawOp || {}) as Record<string, unknown>;
          const grupoTituloReq = sanitizeString(opObj.grupoTitulo, 80);
          const nombreOpReq = sanitizeString(opObj.nombre, 80);
          if (!nombreOpReq) continue;

          const grupoMatch =
            prodServer.opciones.find(
              (g) =>
                g.titulo.trim().toLowerCase() === grupoTituloReq.toLowerCase()
            ) ||
            prodServer.opciones.find((g) =>
              g.items?.some(
                (itemOp) =>
                  itemOp.nombre.trim().toLowerCase() ===
                  nombreOpReq.toLowerCase()
              )
            );
          const itemOpMatch = grupoMatch?.items?.find(
            (itemOp) =>
              itemOp.nombre.trim().toLowerCase() === nombreOpReq.toLowerCase()
          );

          if (itemOpMatch) {
            const precioOp = Math.max(0, Number(itemOpMatch.precio) || 0);
            extrasUnitarios += precioOp;
            opcionesLimpias.push({
              grupoTitulo: grupoMatch?.titulo || grupoTituloReq,
              nombre: itemOpMatch.nombre,
              precio: precioOp,
            });
          }
        }
      }

      const baseUnitPrice = Math.max(
        0,
        Number(getPrecioEfectivoProducto(prodServer)) || 0
      );
      const precioUnitarioReal = baseUnitPrice + extrasUnitarios;

      itemsLimpios.push({
        nombre: prodServer.nombre,
        cantidad,
        precio: precioUnitarioReal,
        subtotal: precioUnitarioReal * cantidad,
        ...(opcionesLimpias.length > 0 ? { opciones: opcionesLimpias } : {}),
      });
    }

    if (itemsLimpios.length === 0) {
      return NextResponse.json(
        { ok: false, error: "El pedido debe contener al menos 1 producto" },
        { status: 400 }
      );
    }

    const clienteLimpio = sanitizeString(cliente_nombre, 80) || "Cliente";
    const clienteTelefonoLimpio = sanitizeString(cliente_telefono, 40);
    const telefonoNormalizado = normalizePhone(clienteTelefonoLimpio);

    // Rate Limiting por número de teléfono: máximo 5 pedidos por cada 15 minutos
    if (telefonoNormalizado) {
      const phoneRateLimit = checkRateLimit(
        `checkout:tel:${telefonoNormalizado}`,
        5,
        15 * 60 * 1000,
        15 * 60 * 1000
      );

      if (!phoneRateLimit.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Has alcanzado el límite de 5 pedidos recientes con este número de teléfono. Por favor espera unos minutos o confirma tu orden previa por WhatsApp.",
          },
          { status: 429 }
        );
      }

      // Verificación de Lista Negra (Blacklist):
      // Si el número fue reportado por no presentarse o bromas, se restringe el pago en efectivo
      if (isPhoneBlacklisted(telefonoNormalizado)) {
        if (
          metodo_pago !== "Transferencia" &&
          metodo_pago !== "Transferencia Bancaria"
        ) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "Este número de teléfono tiene restringidos los pedidos con pago en efectivo debido a comandas previas no retiradas. Por favor selecciona 'Transferencia Bancaria' para procesar tu pedido.",
            },
            { status: 403 }
          );
        }
      }
    }

    const horaRetiroLimpia = sanitizeString(hora_retiro, 40) || "lo_antes_posible";
    const tipoEntregaLimpio =
      tipo_entrega === "Consumo en mesa" || tipo_entrega === "Mesa"
        ? "Mesa"
        : "Retiro";
    const direccionLimpia = sanitizeString(direccion_mesa, 150);
    const metodoPagoLimpio =
      metodo_pago === "Transferencia" || metodo_pago === "Transferencia Bancaria"
        ? "Transferencia"
        : "Efectivo";
    const notasLimpias = sanitizeString(notas, 300);
    const totalNum = itemsLimpios.reduce(
      (acc, item) => acc + (Number(item.subtotal) || 0),
      0
    );

    // Protección financiera: límite de monto en efectivo ($25.000 CLP)
    if (metodoPagoLimpio === "Efectivo" && totalNum > 25000) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Por seguridad del local, los pedidos superiores a $25.000 requieren pago por Transferencia Bancaria para asegurar la preparación de insumos en cocina.",
        },
        { status: 400 }
      );
    }

    const result = await crearPedidoEnSupabase({
      local_slug: slugLimpio,
      cliente_nombre: clienteLimpio,
      cliente_telefono: clienteTelefonoLimpio || undefined,
      hora_retiro: horaRetiroLimpia,
      tipo_entrega: tipoEntregaLimpio,
      direccion_mesa: direccionLimpia,
      metodo_pago: metodoPagoLimpio,
      notas: notasLimpias,
      items: itemsLimpios,
      total: totalNum,
    });

    if (!result.ok) {
      recordFailedAttempt(`checkout:${ip}`, 30);
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en POST /api/pedidos:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al guardar el pedido" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { pedidoId, estado } = body;

    if (!pedidoId || typeof pedidoId !== "string") {
      return NextResponse.json(
        { ok: false, error: "pedidoId es requerido" },
        { status: 400 }
      );
    }

    const pedidoExistente = await obtenerPedidoPorIdEnSupabase(pedidoId);
    if (!pedidoExistente) {
      return NextResponse.json(
        { ok: false, error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const isSuperAdmin = isSuperAdminAuthorized(req.cookies);
    if (!isKdsAuthorized(req.cookies, pedidoExistente.local_slug)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Acceso no autorizado. Se requiere sesión válida de cocina o administración para este local.",
        },
        { status: 401 }
      );
    }

    const estadosValidos: EstadoPedido[] = [
      "pendiente",
      "preparando",
      "listo",
      "entregado",
      "cancelado",
    ];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { ok: false, error: "Estado no válido" },
        { status: 400 }
      );
    }

    const result = await actualizarEstadoPedidoEnSupabase(pedidoId, estado);
    if (!result.ok) {
      return NextResponse.json(result, { status: 500 });
    }

    // Si se solicitó bloquear el número por comanda cancelada o broma
    const telefonoParaBloquear =
      pedidoExistente.cliente_telefono ||
      (typeof body.telefono === "string" ? body.telefono : "");
    if (estado === "cancelado" && body.bloquearTelefono && telefonoParaBloquear) {
      addPhoneToBlacklist(
        String(telefonoParaBloquear),
        String(body.motivoBloqueo || "Comanda no retirada / broma"),
        isSuperAdmin ? "superadmin" : "admin"
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en PATCH /api/pedidos:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al actualizar el pedido" },
      { status: 500 }
    );
  }
}

