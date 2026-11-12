import { getSupabaseAdminClient } from "@/lib/supabase-server";
import {
  addPhoneToBlacklist,
  BlacklistEntry,
  getBlacklistedPhones,
  isPhoneBlacklisted,
  normalizePhone,
  removePhoneFromBlacklist,
} from "@/lib/security";

export interface PersistentBlacklistEntry extends BlacklistEntry {
  localSlug?: string;
}

const STORAGE_BUCKET = "pidetirua-db";
const BLACKLIST_FILE = "blacklist-state.json";
const CACHE_TTL_MS = 15 * 1000;

let cachedEntries: PersistentBlacklistEntry[] | null = null;
let cacheLoadedAt = 0;

function syncMemoryFromList(entries: PersistentBlacklistEntry[]): void {
  for (const entry of entries) {
    if (!isPhoneBlacklisted(entry.telefono)) {
      addPhoneToBlacklist(entry.telefono, entry.motivo, entry.bloqueadoPor);
    }
  }
}

async function readBlacklistFromStorage(): Promise<PersistentBlacklistEntry[]> {
  const now = Date.now();
  if (cachedEntries && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedEntries;
  }

  const mapByPhone = new Map<string, PersistentBlacklistEntry>();
  for (const mem of getBlacklistedPhones()) {
    mapByPhone.set(mem.telefono, { ...mem });
  }

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
  } catch {
    // Usar fallback en memoria si Storage no está accesible
  }

  const list = Array.from(mapByPhone.values()).sort((a, b) =>
    b.fecha.localeCompare(a.fecha)
  );
  syncMemoryFromList(list);
  cachedEntries = list;
  cacheLoadedAt = now;
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
    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(BLACKLIST_FILE, new Blob([payload], { type: "application/json" }), {
        upsert: true,
        contentType: "application/json",
        cacheControl: "0",
      });
  } catch (err) {
    console.warn("No se pudo persistir blacklist en Storage:", err);
  }
}

/**
 * Verifica si un teléfono está restringido para pago en efectivo (memoria + Storage).
 */
export async function isPhoneBlacklistedPersistent(
  rawPhone: string
): Promise<boolean> {
  const norm = normalizePhone(rawPhone);
  if (!norm) return false;
  if (isPhoneBlacklisted(norm)) return true;

  const list = await readBlacklistFromStorage();
  return list.some((e) => e.telefono === norm);
}

/**
 * Agrega o actualiza un número en la lista negra persistente y en memoria.
 */
export async function addPhoneToBlacklistPersistent(
  rawPhone: string,
  motivo = "No se presentó a retirar comanda en efectivo",
  bloqueadoPor = "admin",
  localSlug?: string
): Promise<{ ok: boolean; telefono: string }> {
  const res = addPhoneToBlacklist(rawPhone, motivo, bloqueadoPor);
  if (!res.ok) return res;

  cachedEntries = null;
  const current = await readBlacklistFromStorage();
  const cleanSlug = localSlug?.toLowerCase().trim();
  const entry: PersistentBlacklistEntry = {
    telefono: res.telefono,
    motivo,
    fecha: new Date().toISOString(),
    bloqueadoPor,
    ...(cleanSlug ? { localSlug: cleanSlug } : {}),
  };

  const next = [
    entry,
    ...current.filter((item) => item.telefono !== res.telefono),
  ];
  await writeBlacklistToStorage(next);
  return res;
}

/**
 * Lista los números bloqueados (filtrados por local si no es SuperAdmin).
 */
export async function listBlacklistedPhonesPersistent(
  localSlug?: string
): Promise<PersistentBlacklistEntry[]> {
  cachedEntries = null;
  const entries = await readBlacklistFromStorage();
  if (!localSlug) return entries;
  const cleanSlug = localSlug.toLowerCase().trim();
  return entries.filter((e) => !e.localSlug || e.localSlug === cleanSlug);
}

/**
 * Elimina un número de la lista negra persistente y de la caché en memoria.
 */
export async function removePhoneFromBlacklistPersistent(
  rawPhone: string,
  localSlug?: string
): Promise<boolean> {
  const norm = normalizePhone(rawPhone);
  if (!norm) return false;

  cachedEntries = null;
  const current = await readBlacklistFromStorage();
  const cleanSlug = localSlug?.toLowerCase().trim();
  const target = current.find((e) => e.telefono === norm);

  if (
    cleanSlug &&
    target &&
    target.localSlug &&
    target.localSlug !== cleanSlug
  ) {
    return false;
  }

  removePhoneFromBlacklist(norm);
  const next = current.filter((e) => e.telefono !== norm);
  const removed = next.length !== current.length || Boolean(target);
  if (removed) {
    await writeBlacklistToStorage(next);
  }
  return removed;
}
