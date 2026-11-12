import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { isSuperAdminAuthorized } from "@/lib/security";
import type { Local } from "@/types/local";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SqlLocalMeta {
  slug: string;
  nombre: string;
  activo: boolean;
  abierto: boolean;
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const isSuperAdmin = isSuperAdminAuthorized(req.cookies);
  const supabase = getSupabaseAdminClient();

  let storageOk = false;
  let sqlLocalesOk = false;
  let sqlPedidosOk = false;
  let cloudLocales: Local[] = [];
  let sqlLocales: SqlLocalMeta[] = [];
  let pedidosCount: number | null = null;
  const errors: string[] = [];

  const [storageRes, localesRes, pedidosRes] = await Promise.allSettled([
    supabase.storage.from("pidetirua-db").download("locales-state.json"),
    supabase.from("locales").select("slug, nombre, activo, abierto"),
    supabase.from("pedidos").select("id", { count: "exact", head: true }),
  ]);

  if (storageRes.status === "fulfilled") {
    const { data, error } = storageRes.value;
    if (!error && data) {
      try {
        const parsed = JSON.parse(await data.text());
        if (Array.isArray(parsed)) {
          cloudLocales = parsed as Local[];
          storageOk = true;
        } else {
          errors.push("locales-state.json no es un arreglo válido");
        }
      } catch {
        errors.push("No se pudo parsear locales-state.json");
      }
    } else {
      errors.push(error?.message || "Error leyendo Storage locales-state.json");
    }
  } else {
    errors.push("Excepción consultando Storage");
  }

  if (localesRes.status === "fulfilled") {
    const { data, error } = localesRes.value;
    if (!error && Array.isArray(data)) {
      sqlLocales = data as SqlLocalMeta[];
      sqlLocalesOk = true;
    } else {
      errors.push(error?.message || "Error consultando tabla locales");
    }
  } else {
    errors.push("Excepción consultando tabla locales");
  }

  if (pedidosRes.status === "fulfilled") {
    const { count, error } = pedidosRes.value;
    if (!error) {
      pedidosCount = typeof count === "number" ? count : 0;
      sqlPedidosOk = true;
    } else {
      errors.push(error?.message || "Error consultando tabla pedidos");
    }
  } else {
    errors.push("Excepción consultando tabla pedidos");
  }

  const driftSlugs: string[] = [];
  if (storageOk && sqlLocalesOk) {
    const sqlBySlug = new Map(sqlLocales.map((r) => [r.slug, r]));
    for (const c of cloudLocales) {
      const s = sqlBySlug.get(c.slug);
      if (
        !s ||
        Boolean(c.activo) !== Boolean(s.activo) ||
        Boolean(c.abierto) !== Boolean(s.abierto) ||
        c.nombre !== s.nombre
      ) {
        driftSlugs.push(c.slug);
      }
    }
    for (const s of sqlLocales) {
      if (!cloudLocales.some((c) => c.slug === s.slug)) {
        driftSlugs.push(s.slug);
      }
    }
  }

  const coreHealthy = storageOk && sqlLocalesOk && sqlPedidosOk;
  const syncDriftCount = driftSlugs.length;
  const status: "ok" | "degraded" | "error" = !coreHealthy
    ? "error"
    : syncDriftCount > 0
    ? "degraded"
    : "ok";

  const activosCount = cloudLocales.filter((l) => l.activo !== false).length;
  const abiertosCount = cloudLocales.filter(
    (l) => l.activo !== false && l.abierto !== false
  ).length;

  const commit =
    (process.env.VERCEL_GIT_COMMIT_SHA || "").trim().slice(0, 7) || null;

  const payload: Record<string, unknown> = {
    ok: coreHealthy,
    status,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    commit,
    checks: {
      storage: storageOk,
      sqlLocales: sqlLocalesOk,
      sqlPedidos: sqlPedidosOk,
      syncDriftCount,
    },
    locales: {
      total: cloudLocales.length,
      activos: activosCount,
      abiertos: abiertosCount,
    },
    pedidosCount,
  };

  if (isSuperAdmin) {
    payload.adminDetails = {
      driftSlugs,
      errors,
      env: {
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
        hasCustomAuthSecret: Boolean(
          process.env.AUTH_SECRET || process.env.SESSION_SECRET
        ),
        hasCustomSuperAdminKey: Boolean(process.env.SUPERADMIN_KEY),
      },
    };
  }

  return NextResponse.json(payload, {
    status: coreHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
