import { createClient, SupabaseClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("lib/supabase-server.ts no puede ser importado en el cliente.");
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://bjyixtdzfabpmjftfkvw.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Cliente exclusivo de servidor con privilegios administrativos (service_role)
 * para operaciones seguras en rutas API y Server Components.
 * NUNCA se expone ni se empaqueta en el bundle del cliente.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdminInstance) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "ADVERTENCIA DE SEGURIDAD: SUPABASE_SERVICE_ROLE_KEY no está configurada. Operando con fallback anónimo."
      );
    }

    supabaseAdminInstance = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
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
