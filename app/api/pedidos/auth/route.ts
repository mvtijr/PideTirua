import { NextRequest, NextResponse } from "next/server";
import {
  fetchLocalBySlug,
  verifyPinCocinaInSupabase,
  verifyTokenCocinaInSupabase,
} from "@/lib/locales";
import {
  checkRateLimit,
  getClientIp,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, pin, token, action } = body;
    const ip = getClientIp(req);

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { ok: false, error: "Slug del local requerido" },
        { status: 400 }
      );
    }

    const localSlug = slug.toLowerCase().trim();
    const local = await fetchLocalBySlug(localSlug);
    if (!local) {
      return NextResponse.json(
        { ok: false, error: "Local no encontrado" },
        { status: 404 }
      );
    }

    if (action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.delete(`pidetirua_kds_${localSlug}`);
      return response;
    }

    // Rate Limiting contra ataques de fuerza bruta al PIN de cocina (5 intentos / 10 minutos)
    const rateLimitKey = `kds-pin:${localSlug}:${ip}`;
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
          error: `Demasiados intentos fallidos. Acceso al monitor de pedidos bloqueado temporalmente por ${mins} minutos.`,
          retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
          locked: true,
        },
        { status: 429 }
      );
    }

    let autenticado = false;

    // Validación 1: Token directo de 1 clic (para tablets de cocina/barra)
    if (token && typeof token === "string") {
      autenticado = await verifyTokenCocinaInSupabase(localSlug, token);
    }

    // Validación 2: PIN numérico de 4 dígitos de trabajadores/personal
    if (!autenticado && pin && typeof pin === "string") {
      autenticado = await verifyPinCocinaInSupabase(localSlug, pin);
    }

    if (!autenticado) {
      const failedResult = recordFailedAttempt(
        rateLimitKey,
        5,
        10 * 60 * 1000
      );
      return NextResponse.json(
        {
          ok: false,
          error: failedResult.locked
            ? "Has superado el límite de 5 intentos fallidos. Monitor bloqueado por 10 minutos."
            : "PIN de personal incorrecto. Solicita la clave o enlace al administrador.",
          locked: failedResult.locked,
          retryAfterSeconds: failedResult.retryAfterSeconds,
        },
        { status: failedResult.locked ? 429 : 401 }
      );
    }

    // Éxito: restablecer intentos fallidos
    resetRateLimit(rateLimitKey);

    // Autenticación exitosa: cookie de 30 días para no interrumpir el trabajo diario de la tablet
    const response = NextResponse.json({
      ok: true,
      localNombre: local.nombre,
      localSlug: local.slug,
    });

    response.cookies.set(`pidetirua_kds_${localSlug}`, "authenticated", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      httpOnly: false, // Accesible por cliente para sincronizar sesión
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno del servidor";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
