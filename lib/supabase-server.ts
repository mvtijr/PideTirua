import { createClient, SupabaseClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("lib/supabase-server.ts no puede ser importado en el cliente.");
}

const DEFAULT_URL = "https://bjyixtdzfabpmjftfkvw.supabase.co";

let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Cliente exclusivo de servidor con privilegios administrativos (service_role)
 * para operaciones seguras en rutas API y Server Components.
 * NUNCA se expone ni se empaqueta en el bundle del cliente.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseAdminInstance) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "ADVERTENCIA DE SEGURIDAD: SUPABASE_SERVICE_ROLE_KEY no está configurada. Operando con fallback anónimo."
      );
    }
    supabaseAdminInstance = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: (url, options = {}) =>
            fetch(url, {
              ...options,
              cache: "no-store",
            }),
        },
      }
    );
  }
  return supabaseAdminInstance;
}

let supabaseCacheableInstance: SupabaseClient | null = null;

/**
 * Cliente de lectura pública en servidor compatible con ISR (`revalidate`) de Next.js:
 * permite caché en Edge/CDN e invalidación inmediata mediante `revalidateTag("locales-catalog")`.
 */
export function getSupabaseCacheableAdminClient(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseCacheableInstance) {
    supabaseCacheableInstance = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          fetch: (url, options = {}) => {
            const method = (options.method || "GET").toUpperCase();
            if (method === "GET") {
              const cleanOptions = { ...options };
              delete cleanOptions.cache;
              return fetch(url, {
                ...cleanOptions,
                next: { revalidate: 30, tags: ["locales-catalog"] },
              });
            }
            return fetch(url, {
              ...options,
              cache: "no-store",
            });
          },
        },
      }
    );
  }
  return supabaseCacheableInstance;
}
