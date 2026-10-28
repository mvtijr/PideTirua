import { NextRequest, NextResponse } from "next/server";
import { obtenerEstadoPedidoPorId } from "@/lib/pedidos";
import { sanitizeString } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const pedidoId = req.nextUrl.searchParams.get("id") || "";
  const idLimpio = sanitizeString(pedidoId, 60);

  if (!idLimpio) {
    return NextResponse.json(
      { ok: false, error: "ID de pedido requerido" },
      { status: 400 }
    );
  }

  const result = await obtenerEstadoPedidoPorId(idLimpio);
  if (!result.ok) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}
