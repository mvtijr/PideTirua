import { NextRequest, NextResponse } from "next/server";
import { fetchLocalBySlug, stripSensitiveLocalFields } from "@/lib/locales";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const local = await fetchLocalBySlug(slug, true);

    if (!local) {
      return NextResponse.json(
        { ok: false, error: "Local no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, local: stripSensitiveLocalFields(local) },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[API Menu Slug] Error al obtener carta:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al obtener la carta" },
      { status: 500 }
    );
  }
}
