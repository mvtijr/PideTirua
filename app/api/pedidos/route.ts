import { NextRequest, NextResponse } from "next/server";
import {
  actualizarEstadoPedidoEnSupabase,
  crearPedidoEnSupabase,
  listarPedidosPorLocalEnSupabase,
} from "@/lib/pedidos";
import { EstadoPedido, ItemPedidoGuardado } from "@/types/local";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const localSlug = req.nextUrl.searchParams.get("local_slug") || "";
  if (!localSlug.trim()) {
    return NextResponse.json(
      { ok: false, error: "Falta el parámetro local_slug" },
      { status: 400 }
    );
  }

  const pedidos = await listarPedidosPorLocalEnSupabase(localSlug.trim());
  return NextResponse.json({ ok: true, pedidos });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      local_slug,
      cliente_nombre,
      tipo_entrega,
      direccion_mesa,
      metodo_pago,
      notas,
      items,
      total,
    } = body;

    if (!local_slug || typeof local_slug !== "string") {
      return NextResponse.json(
        { ok: false, error: "local_slug es requerido" },
        { status: 400 }
      );
    }

    const itemsLimpios: ItemPedidoGuardado[] = Array.isArray(items)
      ? items.map((it: Record<string, unknown>) => {
          const cantidad = Number(it.cantidad) || 1;
          const precio = Number(it.precio) || 0;
          return {
            nombre: String(it.nombre || "Producto"),
            cantidad,
            precio,
            subtotal:
              typeof it.subtotal === "number"
                ? it.subtotal
                : cantidad * precio,
          };
        })
      : [];

    const result = await crearPedidoEnSupabase({
      local_slug,
      cliente_nombre: String(cliente_nombre || "Cliente"),
      tipo_entrega: String(tipo_entrega || "Retiro"),
      direccion_mesa: String(direccion_mesa || ""),
      metodo_pago: String(metodo_pago || "Efectivo"),
      notas: String(notas || ""),
      items: itemsLimpios,
      total: Number(total) || 0,
    });

    if (!result.ok) {
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

    const estadosValidos: EstadoPedido[] = [
      "pendiente",
      "preparando",
      "listo",
      "entregado",
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en PATCH /api/pedidos:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al actualizar el pedido" },
      { status: 500 }
    );
  }
}
