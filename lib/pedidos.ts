import { getSupabaseAdminClient } from "@/lib/supabase-server";
import {
  EstadoPedido,
  ItemPedidoGuardado,
  Pedido,
} from "@/types/local";

export interface NuevoPedidoInput {
  local_slug: string;
  cliente_nombre: string;
  cliente_telefono?: string;
  hora_retiro?: string;
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
    estadoRaw === "entregado" ||
    estadoRaw === "cancelado"
      ? estadoRaw
      : "pendiente";

  // Extraer teléfono de cliente: si no viene en columna, buscar en notas (ej: "Tel: +569...")
  let clienteTelefono =
    row.cliente_telefono !== undefined && row.cliente_telefono !== null
      ? String(row.cliente_telefono).trim()
      : "";
  const notasStr = String(row.notas || "");
  if (!clienteTelefono && notasStr) {
    const matchTel = notasStr.match(/(?:Tel|Teléfono|WhatsApp):\s*([+\d\s\-()]+)/i);
    if (matchTel && matchTel[1]) {
      clienteTelefono = matchTel[1].trim();
    }
  }

  // Hora de retiro programada (default: 'lo_antes_posible')
  let horaRetiro =
    row.hora_retiro !== undefined && row.hora_retiro !== null && String(row.hora_retiro).trim()
      ? String(row.hora_retiro).trim()
      : "lo_antes_posible";
  if (horaRetiro === "lo_antes_posible" && notasStr) {
    const matchHora = notasStr.match(/Retiro programado:\s*([\d:apAPmM\s]+hrs?)/i);
    if (matchHora && matchHora[1]) {
      horaRetiro = matchHora[1].replace(/hrs?/i, "").trim();
    }
  }

  return {
    id: String(row.id || ""),
    created_at: String(row.created_at || new Date().toISOString()),
    local_slug: String(row.local_slug || ""),
    cliente_nombre: String(row.cliente_nombre || "Cliente"),
    cliente_telefono: clienteTelefono || undefined,
    hora_retiro: horaRetiro,
    tipo_entrega: String(row.tipo_entrega || "Retiro"),
    direccion_mesa: String(row.direccion_mesa || ""),
    metodo_pago: String(row.metodo_pago || "Efectivo"),
    notas: notasStr,
    items,
    total: Number(row.total) || 0,
    estado,
  };
}

export async function crearPedidoEnSupabase(
  input: NuevoPedidoInput
): Promise<{ ok: boolean; pedido?: Pedido; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const payloadBase: Record<string, unknown> = {
      local_slug: input.local_slug.trim(),
      cliente_nombre: input.cliente_nombre.trim() || "Cliente",
      tipo_entrega: input.tipo_entrega.trim(),
      direccion_mesa: input.direccion_mesa.trim(),
      metodo_pago: input.metodo_pago.trim(),
      notas: input.notas.trim(),
      items: input.items,
      total: Math.round(Number(input.total) || 0),
      estado: "pendiente",
    };

    const payloadConColumnasNuevas: Record<string, unknown> = {
      ...payloadBase,
      cliente_telefono: input.cliente_telefono?.trim() || null,
      hora_retiro: input.hora_retiro?.trim() || "lo_antes_posible",
    };

    let { data, error } = await supabase
      .from("pedidos")
      .insert(payloadConColumnasNuevas)
      .select("*")
      .single();

    // Fallback de resiliencia si la base de datos remota aún no ha corrido la migración de columnas (código 42703)
    if (error && (error.code === "42703" || error.message?.includes("column"))) {
      console.warn("Columna no encontrada en pedidos, reintentando inserción con payload base:", error.message);
      const retry = await supabase
        .from("pedidos")
        .insert(payloadBase)
        .select("*")
        .single();
      data = retry.data;
      error = retry.error;
    }

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
    const supabase = getSupabaseAdminClient();
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
    const supabase = getSupabaseAdminClient();
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

export async function obtenerEstadoPedidoPorId(
  pedidoId: string
): Promise<{ ok: boolean; estado?: EstadoPedido; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("pedidos")
      .select("id, estado")
      .eq("id", pedidoId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: "Pedido no encontrado" };
    }

    const estadoRaw = String(data.estado || "pendiente");
    const estado: EstadoPedido =
      estadoRaw === "preparando" ||
      estadoRaw === "listo" ||
      estadoRaw === "entregado" ||
      estadoRaw === "cancelado"
        ? estadoRaw
        : "pendiente";

    return { ok: true, estado };
  } catch (err: unknown) {
    return { ok: false, error: String(err) };
  }
}
