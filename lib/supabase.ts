import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://bjyixtdzfabpmjftfkvw.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_bioLxnLmQ7QWuSqWLlAwZg__d2XRK4F";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_PUBLISHABLE_KEY;

let supabaseInstance: SupabaseClient | null = null;

/**
 * Cliente Supabase de uso público / anónimo para el frontend y operaciones cliente.
 * NUNCA contiene ni expone la clave service_role.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
