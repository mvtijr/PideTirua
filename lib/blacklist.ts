import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { BlacklistEntry, normalizePhone } from "@/lib/security";

export interface PersistentBlacklistEntry extends BlacklistEntry {
  localSlug?: string;
}

const STORAGE_BUCKET = "pidetirua-db";
const BLACKLIST_FILE = "blacklist-state.json";
const CACHE_TTL_MS = 2 * 1000;

let cachedEntries: PersistentBlacklistEntry[] | null = null;
let cacheLoadedAt = 0;

/**
 * Lee exclusivamente desde Supabase Storage (`blacklist-state.json`) como única fuente de verdad
 * para evitar desincronización o resurrección de teléfonos entre instancias Serverless.
 */
async function readBlacklistFromStorage(
  forceFresh = false
): Promise<PersistentBlacklistEntry[]> {
  const now = Date.now();
  if (!forceFresh && cachedEntries && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedEntries;
  }

  const mapByPhone = new Map<string, PersistentBlacklistEntry>();

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(BLACKLIST_FILE);

    if (!error && data) {
      const parsed = JSON.parse(await data.text()) as PersistentBlacklistEntry[];
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const tel = normalizePhone(item?.telefono);
          if (!tel) continue;
          mapByPhone.set(tel, {
            telefono: tel,
            motivo: String(item.motivo || "Comanda no retirada / broma"),
            fecha: String(item.fecha || new Date().toISOString()),
            bloqueadoPor: String(item.bloqueadoPor || "admin"),
            ...(typeof item.localSlug === "string" && item.localSlug
              ? { localSlug: item.localSlug.toLowerCase().trim() }
              : {}),
          });
        }
      }
    }
  } catch (err) {
    console.warn("No se pudo leer blacklist desde Storage:", err);
    if (cachedEntries) return cachedEntries;
  }

  const list = Array.from(mapByPhone.values()).sort((a, b) =>
    b.fecha.localeCompare(a.fecha)
  );
  cachedEntries = list;
  cacheLoadedAt = Date.now();
  return list;
}

async function writeBlacklistToStorage(
  entries: PersistentBlacklistEntry[]
): Promise<void> {
  cachedEntries = entries;
  cacheLoadedAt = Date.now();

  try {
    const supabase = getSupabaseAdminClient();
    const { data: buckets } = await supabase.storage.listBuckets();
    const existsDb = buckets?.some((b) => b.name === STORAGE_BUCKET);
    if (!existsDb) {
      await supabase.storage.createBucket(STORAGE_BUCKET, { public: false });
    }

    const payload = JSON.stringify(entries, null, 2);
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(BLACKLIST_FILE, new Blob([payload], { type: "application/json" }), {
        upsert: true,
        contentType: "application/json",
        cacheControl: "0",
      });
    if (error) {
      console.error("Error subiendo blacklist-state.json a Storage:", error);
    }
  } catch (err) {
    console.error("No se pudo persistir blacklist en Storage:", err);
  }
}

/**
 * Verifica si un teléfono está restringido para pago en efectivo leyendo la fuente persistente.
 */
export async function isPhoneBlacklistedPersistent(
  rawPhone: string
): Promise<boolean> {
  const norm = normalizePhone(rawPhone);
  if (!norm) return false;

  const list = await readBlacklistFromStorage();
  return list.some((e) => e.telefono === norm);
}

/**
 * Agrega o actualiza un número en la lista negra persistente en Storage.
 */
export async function addPhoneToBlacklistPersistent(
  rawPhone: string,
  motivo = "No se presentó a retirar comanda en efectivo",
  bloqueadoPor = "admin",
  localSlug?: string
): Promise<{ ok: boolean; telefono: string }> {
  const norm = normalizePhone(rawPhone);
  if (!norm) return { ok: false, telefono: "" };

  const current = await readBlacklistFromStorage(true);
  const cleanSlug = localSlug?.toLowerCase().trim();
  const entry: PersistentBlacklistEntry = {
    telefono: norm,
    motivo,
    fecha: new Date().toISOString(),
    bloqueadoPor,
    ...(cleanSlug ? { localSlug: cleanSlug } : {}),
  };

  const next = [
    entry,
    ...current.filter((item) => item.telefono !== norm),
  ];
  await writeBlacklistToStorage(next);
  return { ok: true, telefono: norm };
}

/**
 * Lista los números bloqueados (filtrados por local si no es SuperAdmin).
 */
export async function listBlacklistedPhonesPersistent(
  localSlug?: string
): Promise<PersistentBlacklistEntry[]> {
  const entries = await readBlacklistFromStorage(true);
  if (!localSlug) return entries;
  const cleanSlug = localSlug.toLowerCase().trim();
  return entries.filter((e) => !e.localSlug || e.localSlug === cleanSlug);
}

/**
 * Elimina un número de la lista negra persistente.
 */
export async function removePhoneFromBlacklistPersistent(
  rawPhone: string,
  localSlug?: string
): Promise<boolean> {
  const norm = normalizePhone(rawPhone);
  if (!norm) return false;

  const current = await readBlacklistFromStorage(true);
  const cleanSlug = localSlug?.toLowerCase().trim();
  const target = current.find((e) => e.telefono === norm);

  if (!target) {
    return false;
  }

  if (
    cleanSlug &&
    target.localSlug &&
    target.localSlug !== cleanSlug
  ) {
    return false;
  }

  const next = current.filter((e) => e.telefono !== norm);
  await writeBlacklistToStorage(next);
  return true;
}

/**
 * Migra los registros de blacklist asociados a un slug cuando SuperAdmin renombra el local.
 */
export async function migrateBlacklistSlugPersistent(
  oldSlug: string,
  newSlug: string
): Promise<void> {
  const from = oldSlug.toLowerCase().trim();
  const to = newSlug.toLowerCase().trim();
  if (!from || !to || from === to) return;

  const current = await readBlacklistFromStorage(true);
  let changed = false;
  const next = current.map((entry) => {
    if (entry.localSlug === from) {
      changed = true;
      return { ...entry, localSlug: to };
    }
    return entry;
  });
  if (changed) {
    await writeBlacklistToStorage(next);
  }
}
