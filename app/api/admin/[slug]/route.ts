import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  createCategoriaInSupabase,
  createProductoInSupabase,
  deleteCategoriaInSupabase,
  deleteProductoInSupabase,
  fetchLocalBySlug,
  updateLocalAbiertoInSupabase,
  updateLocalAjustesBasicosInSupabase,
  updateLocalDatosBancariosInSupabase,
  updateProductoInSupabase,
  uploadPlatoFotoInSupabase,
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
      revalidatePath("/superadmin");
      return NextResponse.json(result);
    }

    if (action === "update-ajustes-basicos") {
      const { telefono_whatsapp, horario, direccion, pin } = body;
      const result = await updateLocalAjustesBasicosInSupabase(slug, {
        telefono_whatsapp:
          typeof telefono_whatsapp === "string" ? telefono_whatsapp : undefined,
        horario: typeof horario === "string" ? horario : undefined,
        direccion: typeof direccion === "string" ? direccion : undefined,
        pin: typeof pin === "string" ? pin : undefined,
      });
      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      revalidatePath("/superadmin");
      return NextResponse.json(result);
    }

    if (action === "create-categoria") {
      const { nombre } = body;
      const result = await createCategoriaInSupabase(
        slug,
        typeof nombre === "string" ? nombre : ""
      );
      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      return NextResponse.json(result);
    }

    if (action === "delete-categoria") {
      const { categoriaId } = body;
      const result = await deleteCategoriaInSupabase(
        slug,
        String(categoriaId || "")
      );
      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      return NextResponse.json(result);
    }

    if (action === "update-datos-bancarios") {
      const {
        banco,
        tipo_cuenta,
        numero_cuenta,
        rut_titular,
        nombre_titular,
        email_transferencia,
      } = body;
      const result = await updateLocalDatosBancariosInSupabase(slug, {
        banco: typeof banco === "string" ? banco : "",
        tipo_cuenta: typeof tipo_cuenta === "string" ? tipo_cuenta : "",
        numero_cuenta: typeof numero_cuenta === "string" ? numero_cuenta : "",
        rut_titular: typeof rut_titular === "string" ? rut_titular : "",
        nombre_titular:
          typeof nombre_titular === "string" ? nombre_titular : "",
        email_transferencia:
          typeof email_transferencia === "string" ? email_transferencia : "",
      });
      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      return NextResponse.json(result);
    }

    if (action === "upload-foto") {
      const { dataUrl, fileName } = body;
      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json(
          { ok: false, error: "No se recibió la imagen" },
          { status: 400 }
        );
      }
      const uploadRes = await uploadPlatoFotoInSupabase(
        slug,
        dataUrl,
        typeof fileName === "string" ? fileName : "plato.jpg"
      );
      if (!uploadRes.ok) {
        return NextResponse.json(uploadRes, { status: 500 });
      }
      return NextResponse.json(uploadRes);
    }

    if (action === "create-producto") {
      const {
        categoriaId,
        nuevaCategoriaNombre,
        nombre,
        descripcion,
        precio,
        imagen_url,
        etiqueta,
        disponible,
        es_oferta,
        precio_oferta,
        texto_promo,
      } = body;

      if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        return NextResponse.json(
          { ok: false, error: "Ingresa el nombre del plato" },
          { status: 400 }
        );
      }

      const precioNum = Number(precio);
      if (Number.isNaN(precioNum) || precioNum <= 0) {
        return NextResponse.json(
          { ok: false, error: "Ingresa un precio válido" },
          { status: 400 }
        );
      }

      const result = await createProductoInSupabase(slug, {
        categoriaId: typeof categoriaId === "string" ? categoriaId : undefined,
        nuevaCategoriaNombre:
          typeof nuevaCategoriaNombre === "string"
            ? nuevaCategoriaNombre
            : undefined,
        nombre,
        descripcion: typeof descripcion === "string" ? descripcion : "",
        precio: precioNum,
        imagen_url: typeof imagen_url === "string" ? imagen_url : "",
        etiqueta: typeof etiqueta === "string" ? etiqueta : undefined,
        disponible: disponible !== false,
        es_oferta: typeof es_oferta === "boolean" ? es_oferta : false,
        precio_oferta:
          typeof precio_oferta === "number" && !Number.isNaN(precio_oferta)
            ? Number(precio_oferta)
            : undefined,
        texto_promo:
          typeof texto_promo === "string" ? texto_promo.trim() : undefined,
      });

      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      return NextResponse.json(result);
    }

    if (action === "update-producto") {
      const {
        productoId,
        nombre,
        descripcion,
        precio,
        disponible,
        imagen_url,
        etiqueta,
        es_oferta,
        precio_oferta,
        texto_promo,
      } = body;
      const result = await updateProductoInSupabase(slug, String(productoId), {
        ...(typeof nombre === "string" ? { nombre } : {}),
        ...(typeof descripcion === "string" ? { descripcion } : {}),
        ...(typeof precio === "number" ? { precio } : {}),
        ...(typeof disponible === "boolean" ? { disponible } : {}),
        ...(typeof imagen_url === "string" ? { imagen_url } : {}),
        ...(typeof etiqueta === "string" ? { etiqueta } : {}),
        ...(typeof es_oferta === "boolean" ? { es_oferta } : {}),
        ...(precio_oferta !== undefined
          ? {
              precio_oferta:
                precio_oferta != null && !Number.isNaN(Number(precio_oferta))
                  ? Number(precio_oferta)
                  : null,
            }
          : {}),
        ...(texto_promo !== undefined
          ? {
              texto_promo:
                typeof texto_promo === "string" ? texto_promo.trim() : null,
            }
          : {}),
      });
      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      return NextResponse.json(result);
    }

    if (action === "delete-producto") {
      const { productoId } = body;
      const result = await deleteProductoInSupabase(slug, String(productoId));
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
