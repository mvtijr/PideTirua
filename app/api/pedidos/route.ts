import { NextRequest, NextResponse } from "next/server";
import {
  actualizarEstadoPedidoEnSupabase,
  crearPedidoEnSupabase,
  listarPedidosPorLocalEnSupabase,
} from "@/lib/pedidos";
import { EstadoPedido, ItemPedidoGuardado } from "@/types/local";
import {
  addPhoneToBlacklist,
  checkRateLimit,
  getClientIp,
  isPhoneBlacklisted,
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

  // PROTECCIÓN DE SEGURIDAD Y PRIVACIDAD DE DATOS (CERO FUGAS):
  // Solo el dueño del local autenticado, el personal de cocina autorizado o el SuperAdmin pueden consultar pedidos
  const isLocalAdmin =
    req.cookies.get(`pidetirua_admin_${slugLimpio}`)?.value === "authenticated";
  const isStaffKds =
    req.cookies.get(`pidetirua_kds_${slugLimpio}`)?.value === "authenticated";
  const isSuperAdmin =
    req.cookies.get("pidetirua_superadmin")?.value === "authenticated";

  if (!isLocalAdmin && !isSuperAdmin && !isStaffKds) {
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
  return NextResponse.json({ ok: true, pedidos });
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
      total,
    } = body;

    const slugLimpio = sanitizeString(local_slug, 50).toLowerCase();
    if (!slugLimpio) {
      return NextResponse.json(
        { ok: false, error: "local_slug es requerido" },
        { status: 400 }
      );
    }

    const itemsLimpios: ItemPedidoGuardado[] = Array.isArray(items)
      ? items.slice(0, 50).map((it: Record<string, unknown>) => {
          const cantidad = Math.max(1, Math.min(99, Number(it.cantidad) || 1));
          const precio = Math.max(0, Number(it.precio) || 0);
          return {
            nombre: sanitizeString(it.nombre, 80) || "Producto",
            cantidad,
            precio,
            subtotal:
              typeof it.subtotal === "number" && it.subtotal > 0
                ? Math.min(it.subtotal, cantidad * precio)
                : cantidad * precio,
          };
        })
      : [];

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
    const totalNum = Math.max(0, Number(total) || 0);

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
    const isSuperAdmin =
      req.cookies.get("pidetirua_superadmin")?.value === "authenticated";
    const hasAdminCookie =
      isSuperAdmin ||
      req.cookies
        .getAll()
        .some(
          (c) =>
            (c.name.startsWith("pidetirua_admin_") ||
              c.name.startsWith("pidetirua_kds_")) &&
            c.value === "authenticated"
        );

    if (!hasAdminCookie) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Acceso no autorizado. Se requiere sesión de cocina o administración.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { pedidoId, estado } = body;

    if (!pedidoId || typeof pedidoId !== "string") {
      return NextResponse.json(
        { ok: false, error: "pedidoId es requerido" },
        { status: 400 }
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
    if (estado === "cancelado" && body.bloquearTelefono && body.telefono) {
      addPhoneToBlacklist(
        String(body.telefono),
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

