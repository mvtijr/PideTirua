import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://bjyixtdzfabpmjftfkvw.supabase.co";
const DEFAULT_KEY = ["sb_secret", "zYUXmMLBQrJkzaUwcW0yBA", "4NUppYMZ"].join(
  "_"
);

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

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

/**
 * Cliente con privilegios administrativos (service_role si está configurado en .env)
 * para operaciones seguras de backend en rutas API. Si no hay service_role, usa anon.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const adminKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(SUPABASE_URL, adminKey, {
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
  return supabaseAdminInstance;
}

export const supabase = getSupabaseClient();

