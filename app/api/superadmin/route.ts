import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  ensurePlatosBucketVideoSupport,
  fetchAllLocales,
  registerLocalPagoBySuperAdminInSupabase,
  toggleLocalActivoBySuperAdminInSupabase,
  updateLocalPinBySuperAdminInSupabase,
  uploadPlatoFotoInSupabase,
  upsertLocalBySuperAdminInSupabase,
  verifySuperAdminKey,
} from "@/lib/locales";
import { PlanComercial, SectorComuna } from "@/types/local";
import {
  checkRateLimit,
  getClientIp,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isSuperAdmin =
    req.cookies.get("pidetirua_superadmin")?.value === "authenticated";
  if (!isSuperAdmin) {
    return NextResponse.json(
      { ok: false, error: "Acceso no autorizado a SuperAdmin" },
      { status: 401 }
    );
  }
  const locales = await fetchAllLocales();
  return NextResponse.json({ ok: true, locales });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const ip = getClientIp(req);
    const rateLimitKey = `superadmin-key:${ip}`;

    if (action === "verify-key") {
      const rateLimitStatus = checkRateLimit(
        rateLimitKey,
        5,
        10 * 60 * 1000,
        10 * 60 * 1000
      );

      if (!rateLimitStatus.allowed) {
        const mins = Math.ceil(rateLimitStatus.retryAfterSeconds / 60);
        return NextResponse.json(
          {
            ok: false,
            error: `Demasiados intentos fallidos. Acceso SuperAdmin bloqueado temporalmente por ${mins} minutos.`,
            retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
          },
          { status: 429 }
        );
      }

      const { key } = body;
      const valido = verifySuperAdminKey(String(key || ""));
      if (!valido) {
        const failedResult = recordFailedAttempt(
          rateLimitKey,
          5,
          10 * 60 * 1000
        );
        return NextResponse.json(
          {
            ok: false,
            error: failedResult.locked
              ? "Has superado el límite de 5 intentos fallidos. Acceso bloqueado por 10 minutos."
              : "Clave Maestra incorrecta. Verifica e intenta nuevamente.",
            locked: failedResult.locked,
            retryAfterSeconds: failedResult.retryAfterSeconds,
          },
          { status: 401 }
        );
      }

      resetRateLimit(rateLimitKey);

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

    // CONTROL DE SEGURIDAD: Solo usuarios con cookie activa de SuperAdmin pueden ejecutar mutaciones de plataforma
    const isSuperAdmin =
      req.cookies.get("pidetirua_superadmin")?.value === "authenticated";
    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Acceso no autorizado. Se requiere sesión de SuperAdmin autenticada.",
        },
        { status: 401 }
      );
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

    if (action === "registrar-pago") {
      const { slug, fecha_ultimo_pago } = body;
      if (!slug || typeof slug !== "string") {
        return NextResponse.json(
          { ok: false, error: "Slug requerido" },
          { status: 400 }
        );
      }
      const res = await registerLocalPagoBySuperAdminInSupabase(
        slug,
        typeof fecha_ultimo_pago === "string" ? fecha_ultimo_pago : undefined
      );
      if (!res.ok) {
        return NextResponse.json(res, { status: 400 });
      }
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
        dia_cobro,
        fecha_ultimo_pago,
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
        dia_cobro: typeof dia_cobro === "number" ? dia_cobro : undefined,
        fecha_ultimo_pago:
          typeof fecha_ultimo_pago === "string" ? fecha_ultimo_pago : undefined,
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
