import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  fetchLocalBySlug,
  updateLocalAbiertoInSupabase,
  updateProductoInSupabase,
  verifyLocalPinInSupabase,
} from "@/lib/locales";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const local = await fetchLocalBySlug(slug);

  if (!local) {
    return NextResponse.json(
      { ok: false, error: "Local no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, local });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await req.json();
    const { action } = body;

    if (action === "verify-pin") {
      const { pin } = body;
      const valido = await verifyLocalPinInSupabase(slug, String(pin || ""));
      if (!valido) {
        return NextResponse.json(
          { ok: false, error: "PIN incorrecto. Intenta nuevamente." },
          { status: 401 }
        );
      }

      const response = NextResponse.json({ ok: true });
      response.cookies.set(`pidetirua_admin_${slug}`, "authenticated", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        sameSite: "lax",
      });
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.delete(`pidetirua_admin_${slug}`);
      return response;
    }

    if (action === "toggle-abierto") {
      const { abierto } = body;
      const result = await updateLocalAbiertoInSupabase(slug, Boolean(abierto));
      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      return NextResponse.json(result);
    }

    if (action === "update-producto") {
      const { productoId, nombre, precio, disponible } = body;
      const result = await updateProductoInSupabase(slug, String(productoId), {
        ...(typeof nombre === "string" ? { nombre } : {}),
        ...(typeof precio === "number" ? { precio } : {}),
        ...(typeof disponible === "boolean" ? { disponible } : {}),
      });
      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { ok: false, error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en API Admin:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al guardar en Supabase" },
      { status: 500 }
    );
  }
}
