import { getSupabaseClient } from "@/lib/supabase";
import {
  EstadoPedido,
  ItemPedidoGuardado,
  Pedido,
} from "@/types/local";

export interface NuevoPedidoInput {
  local_slug: string;
  cliente_nombre: string;
  tipo_entrega: string;
  direccion_mesa: string;
  metodo_pago: string;
  notas: string;
  items: ItemPedidoGuardado[];
  total: number;
}

function normalizePedidoRow(row: Record<string, unknown>): Pedido {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  const items: ItemPedidoGuardado[] = rawItems.map((it) => {
    const itemObj = (it || {}) as Record<string, unknown>;
    const cantidad = Number(itemObj.cantidad) || 1;
    const precio = Number(itemObj.precio) || 0;
    const subtotal =
      typeof itemObj.subtotal === "number"
        ? itemObj.subtotal
        : cantidad * precio;
    return {
      nombre: String(itemObj.nombre || "Producto"),
      cantidad,
      precio,
      subtotal,
    };
  });

  const estadoRaw = String(row.estado || "pendiente");
  const estado: EstadoPedido =
    estadoRaw === "preparando" ||
    estadoRaw === "listo" ||
    estadoRaw === "entregado"
      ? estadoRaw
      : "pendiente";

  return {
    id: String(row.id || ""),
    created_at: String(row.created_at || new Date().toISOString()),
    local_slug: String(row.local_slug || ""),
    cliente_nombre: String(row.cliente_nombre || "Cliente"),
    tipo_entrega: String(row.tipo_entrega || "Retiro"),
    direccion_mesa: String(row.direccion_mesa || ""),
    metodo_pago: String(row.metodo_pago || "Efectivo"),
    notas: String(row.notas || ""),
    items,
    total: Number(row.total) || 0,
    estado,
  };
}

export async function crearPedidoEnSupabase(
  input: NuevoPedidoInput
): Promise<{ ok: boolean; pedido?: Pedido; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("pedidos")
      .insert({
        local_slug: input.local_slug.trim(),
        cliente_nombre: input.cliente_nombre.trim() || "Cliente",
        tipo_entrega: input.tipo_entrega.trim(),
        direccion_mesa: input.direccion_mesa.trim(),
        metodo_pago: input.metodo_pago.trim(),
        notas: input.notas.trim(),
        items: input.items,
        total: Math.round(Number(input.total) || 0),
        estado: "pendiente",
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error insertando pedido en Supabase:", error);
      return {
        ok: false,
        error: error?.message || "No se pudo registrar el pedido",
      };
    }

    return {
      ok: true,
      pedido: normalizePedidoRow(data as Record<string, unknown>),
    };
  } catch (err) {
    console.error("Excepción al crear pedido:", err);
    return {
      ok: false,
      error: "Error inesperado al guardar el pedido",
    };
  }
}

export async function listarPedidosPorLocalEnSupabase(
  localSlug: string
): Promise<Pedido[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("local_slug", localSlug)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      normalizePedidoRow(row as Record<string, unknown>)
    );
  } catch {
    return [];
  }
}

export async function actualizarEstadoPedidoEnSupabase(
  pedidoId: string,
  nuevoEstado: EstadoPedido
): Promise<{ ok: boolean; pedido?: Pedido; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedidoId)
      .select("*")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: error?.message || "No se pudo actualizar el estado del pedido",
      };
    }

    return {
      ok: true,
      pedido: normalizePedidoRow(data as Record<string, unknown>),
    };
  } catch {
    return {
      ok: false,
      error: "Error de conexión al actualizar estado del pedido",
    };
  }
}
