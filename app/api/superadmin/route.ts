import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  ensurePlatosBucketVideoSupport,
  fetchAllLocales,
  toggleLocalActivoBySuperAdminInSupabase,
  updateLocalPinBySuperAdminInSupabase,
  uploadPlatoFotoInSupabase,
  upsertLocalBySuperAdminInSupabase,
  verifySuperAdminKey,
} from "@/lib/locales";
import { PlanComercial, SectorComuna } from "@/types/local";

export const dynamic = "force-dynamic";

export async function GET() {
  const locales = await fetchAllLocales();
  return NextResponse.json({ ok: true, locales });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "verify-key") {
      const { key } = body;
      const valido = verifySuperAdminKey(String(key || ""));
      if (!valido) {
        return NextResponse.json(
          {
            ok: false,
            error: "Clave Maestra incorrecta. Verifica e intenta nuevamente.",
          },
          { status: 401 }
        );
      }

      const response = NextResponse.json({ ok: true });
      response.cookies.set("pidetirua_superadmin", "authenticated", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.delete("pidetirua_superadmin");
      return response;
    }

    if (action === "ensure-video-bucket") {
      const res = await ensurePlatosBucketVideoSupport();
      return NextResponse.json(res);
    }

    if (action === "upload-imagen") {
      const { slug, dataUrl, fileName } = body;
      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json(
          { ok: false, error: "No se recibió la imagen" },
          { status: 400 }
        );
      }
      const uploadRes = await uploadPlatoFotoInSupabase(
        typeof slug === "string" && slug.trim() ? slug.trim() : "identidad",
        dataUrl,
        typeof fileName === "string" ? fileName : "identidad.jpg"
      );
      if (!uploadRes.ok) {
        return NextResponse.json(uploadRes, { status: 500 });
      }
      return NextResponse.json(uploadRes);
    }

    if (action === "toggle-activo") {
      const { slug, activo } = body;
      if (!slug || typeof slug !== "string") {
        return NextResponse.json(
          { ok: false, error: "Slug requerido" },
          { status: 400 }
        );
      }
      const res = await toggleLocalActivoBySuperAdminInSupabase(
        slug,
        Boolean(activo)
      );
      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      revalidatePath("/superadmin");
      return NextResponse.json(res);
    }

    if (action === "update-pin") {
      const { slug, pin } = body;
      if (!slug || typeof slug !== "string") {
        return NextResponse.json(
          { ok: false, error: "Slug requerido" },
          { status: 400 }
        );
      }
      const res = await updateLocalPinBySuperAdminInSupabase(
        slug,
        String(pin || "")
      );
      if (!res.ok) {
        return NextResponse.json(res, { status: 400 });
      }
      revalidatePath(`/admin/${slug}`);
      revalidatePath("/superadmin");
      return NextResponse.json(res);
    }

    if (action === "upsert-local") {
      const {
        id,
        originalSlug,
        nombre,
        slug,
        rubro,
        sector,
        telefono_whatsapp,
        direccion,
        horario,
        pin,
        plan,
        precio_mensual,
        logo_url,
        banner_url,
        banner_video_url,
        activo,
      } = body;

      if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        return NextResponse.json(
          { ok: false, error: "Ingresa el nombre comercial del negocio" },
          { status: 400 }
        );
      }
      if (!slug || typeof slug !== "string" || !slug.trim()) {
        return NextResponse.json(
          { ok: false, error: "Ingresa el slug URL del negocio" },
          { status: 400 }
        );
      }

      const planValido: PlanComercial =
        plan === "llave_en_mano" ? "llave_en_mano" : "autogestionado";
      const sectorValido: SectorComuna =
        sector === "Quidico" ? "Quidico" : "Tirúa Centro";

      const res = await upsertLocalBySuperAdminInSupabase({
        id: typeof id === "string" ? id : undefined,
        originalSlug:
          typeof originalSlug === "string" ? originalSlug : undefined,
        nombre: nombre.trim(),
        slug: slug.trim(),
        rubro: typeof rubro === "string" ? rubro : "Gastronomía Local",
        sector: sectorValido,
        telefono_whatsapp:
          typeof telefono_whatsapp === "string" ? telefono_whatsapp : "",
        direccion: typeof direccion === "string" ? direccion : "",
        horario: typeof horario === "string" ? horario : "12:00 a 22:30 hrs",
        pin: typeof pin === "string" ? pin : "1234",
        plan: planValido,
        precio_mensual:
          typeof precio_mensual === "number" ? precio_mensual : undefined,
        logo_url: typeof logo_url === "string" ? logo_url : undefined,
        banner_url: typeof banner_url === "string" ? banner_url : undefined,
        banner_video_url:
          typeof banner_video_url === "string"
            ? banner_video_url
            : banner_video_url === null
            ? null
            : undefined,
        activo: typeof activo === "boolean" ? activo : true,
      });

      revalidatePath("/");
      revalidatePath(`/${slug}`);
      revalidatePath(`/admin/${slug}`);
      revalidatePath("/superadmin");
      return NextResponse.json(res);
    }

    return NextResponse.json(
      { ok: false, error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en /api/superadmin:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno en SuperAdmin" },
      { status: 500 }
    );
  }
}
