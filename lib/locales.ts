import localesData from "@/data/locales.json";
import {
  CategoriaFiltro,
  CategoriaMenu,
  Local,
  PlanComercial,
  Producto,
  SectorComuna,
} from "@/types/local";
import { getSupabaseClient } from "@/lib/supabase";

export const CATEGORIAS_DIRECTORIO: CategoriaFiltro[] = [
  "Todos",
  "Sushi",
  "Comida Rápida",
  "Pescados y Mariscos",
  "Cafetería",
];

const STORAGE_BUCKET = "pidetirua-db";
const STORAGE_STATE_FILE = "locales-state.json";
const PLATOS_IMAGES_BUCKET = "platos";

import { timingSafeCompare } from "@/lib/security";

export function verifySuperAdminKey(inputKey: string): boolean {
  const expected = (process.env.SUPERADMIN_KEY || "Tirua2026Admin").trim();
  return timingSafeCompare(inputKey.trim(), expected);
}

/**
 * Elimina campos administrativos y sensibles (PIN, datos comerciales privados)
 * antes de enviar información de locales al cliente público o en páginas no autenticadas.
 */
export function stripSensitiveLocalFields(local: Local): Local {
  const { pin, precio_mensual, dia_cobro, fecha_ultimo_pago, ...safeLocal } =
    local;
  return safeLocal as Local;
}

/**
 * Sanitiza una lista completa de locales para consumo público.
 */
export function sanitizeLocalesForPublic(locales: Local[]): Local[] {
  return locales.map(stripSensitiveLocalFields);
}


interface SupabaseProductoRow {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagen_url: string | null;
  disponible: boolean;
  destacado?: boolean | null;
  etiqueta?: string | null;
  es_oferta?: boolean | null;
  precio_oferta?: number | null;
  texto_promo?: string | null;
  orden?: number | null;
}

interface SupabaseCategoriaRow {
  id: string;
  local_id: string;
  nombre: string;
  orden: number;
  productos?: SupabaseProductoRow[];
}

interface SupabaseLocalRow {
  id: string;
  slug: string;
  nombre: string;
  rubro: string;
  telefono_whatsapp: string;
  direccion: string;
  horario: string;
  abierto: boolean;
  pin: string;
  banco?: string | null;
  tipo_cuenta?: string | null;
  numero_cuenta?: string | null;
  rut_titular?: string | null;
  nombre_titular?: string | null;
  email_transferencia?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  banner_video_url?: string | null;
  plan?: string | null;
  precio_mensual?: number | null;
  activo?: boolean | null;
  dia_cobro?: number | null;
  fecha_ultimo_pago?: string | null;
  sector?: string | null;
  ubicacion?: string | null;
  tiempo_estimado?: string | null;
  calificacion?: number | null;
  descripcion_corta?: string | null;
  foto_portada?: string | null;
  video_portada?: string | null;
  video_fondo?: string | null;
  logo?: string | null;
  categoria_filtro?: string[] | null;
  categorias?: SupabaseCategoriaRow[];
}

function getTodayDateISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeStaticLocal(raw: Local): Local {
  const isVipDefault =
    raw.slug === "las-tranqueras" || raw.slug === "gran-pacifico";
  const plan: PlanComercial =
    raw.plan === "llave_en_mano" || raw.plan === "autogestionado"
      ? raw.plan
      : isVipDefault
      ? "llave_en_mano"
      : "autogestionado";
  const precioMensual =
    typeof raw.precio_mensual === "number" && raw.precio_mensual > 0
      ? raw.precio_mensual
      : plan === "llave_en_mano"
      ? 28000
      : 15000;
  const diaCobro =
    typeof raw.dia_cobro === "number" &&
    raw.dia_cobro >= 1 &&
    raw.dia_cobro <= 31
      ? Math.round(raw.dia_cobro)
      : 5;
  const fechaUltimoPago =
    typeof raw.fecha_ultimo_pago === "string" && raw.fecha_ultimo_pago.trim()
      ? raw.fecha_ultimo_pago.slice(0, 10)
      : getTodayDateISO();
  const logoFinal = raw.logo_url || raw.logo || "/logo-pidetirua.jpg";
  const bannerFinal =
    raw.banner_url ||
    raw.fotoPortada ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=90";
  const bannerVideoFinal =
    raw.banner_video_url !== undefined
      ? raw.banner_video_url || undefined
      : raw.videoPortada || undefined;

  return {
    ...raw,
    pin: raw.pin || "1234",
    activo: raw.activo !== false,
    plan,
    precio_mensual: precioMensual,
    dia_cobro: diaCobro,
    fecha_ultimo_pago: fechaUltimoPago,
    logo: logoFinal,
    logo_url: logoFinal,
    fotoPortada: bannerFinal,
    banner_url: bannerFinal,
    banner_video_url: bannerVideoFinal,
    videoPortada: bannerVideoFinal,
    direccion: raw.direccion || raw.direccionDetalle,
    direccionDetalle: raw.direccion || raw.direccionDetalle,
    telefono_whatsapp: raw.telefono_whatsapp || raw.telefonoWhatsapp,
    telefonoWhatsapp: raw.telefono_whatsapp || raw.telefonoWhatsapp,
    categorias: (raw.categorias || []).map((cat, idx) => ({
      ...cat,
      local_id: raw.id,
      orden: cat.orden ?? idx + 1,
      productos: (cat.productos || []).map((prod) => ({
        ...prod,
        categoria_id: cat.id,
        imagen: prod.imagen_url || prod.imagen,
        imagen_url: prod.imagen_url || prod.imagen,
        disponible: prod.disponible !== false,
        es_oferta: Boolean(prod.es_oferta),
        precio_oferta:
          typeof prod.precio_oferta === "number"
            ? prod.precio_oferta
            : undefined,
        texto_promo: prod.texto_promo?.trim() || undefined,
      })),
    })),
  };
}

export function getAllLocales(): Local[] {
  return (localesData as Local[]).map(normalizeStaticLocal);
}

export function getLocalBySlug(slug: string): Local | undefined {
  const locales = getAllLocales();
  return locales.find(
    (local) => local.slug.toLowerCase() === slug.toLowerCase()
  );
}

function inferCategoriaFiltro(
  rubro: string,
  existing?: Local["categoriaFiltro"]
): Local["categoriaFiltro"] {
  if (existing && existing.length > 0) return existing;
  const r = rubro.toLowerCase();
  if (r.includes("sushi")) return ["Sushi"];
  if (r.includes("marisco") || r.includes("pescado"))
    return ["Pescados y Mariscos"];
  if (r.includes("café") || r.includes("cafe") || r.includes("pastel"))
    return ["Cafetería"];
  return ["Comida Rápida"];
}

function mapSupabaseRowToLocal(
  row: SupabaseLocalRow,
  fallback?: Local
): Local {
  const isVipDefault =
    row.slug === "las-tranqueras" || row.slug === "gran-pacifico";
  const plan: PlanComercial =
    row.plan === "llave_en_mano"
      ? "llave_en_mano"
      : row.plan === "autogestionado"
      ? "autogestionado"
      : fallback?.plan || (isVipDefault ? "llave_en_mano" : "autogestionado");

  const precioMensual =
    typeof row.precio_mensual === "number" && row.precio_mensual > 0
      ? row.precio_mensual
      : fallback?.precio_mensual ||
        (plan === "llave_en_mano" ? 28000 : 15000);

  const activo =
    typeof row.activo === "boolean"
      ? row.activo
      : fallback?.activo !== false;

  const base: Local = fallback || {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    rubro: row.rubro,
    categoriaFiltro: inferCategoriaFiltro(row.rubro),
    sector: ((row.sector as SectorComuna) || "Tirúa Centro") as SectorComuna,
    ubicacion: row.ubicacion || row.sector || "Tirúa Centro",
    direccion: row.direccion,
    direccionDetalle: row.direccion,
    telefonoWhatsapp: row.telefono_whatsapp,
    telefono_whatsapp: row.telefono_whatsapp,
    horario: row.horario || "12:00 a 22:00 hrs",
    horarioEntrega: `Lun a Dom · ${row.horario || "12:00 a 22:00 hrs"}`,
    tiempoEstimado: row.tiempo_estimado || "25 - 35 min",
    calificacion: Number(row.calificacion ?? 4.9),
    descripcionCorta:
      row.descripcion_corta ||
      `Carta digital oficial de ${row.nombre} en PideTirúa. Realiza tu pedido directo a nuestro WhatsApp.`,
    fotoPortada:
      row.banner_url ||
      row.foto_portada ||
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=90",
    banner_url:
      row.banner_url ||
      row.foto_portada ||
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=90",
    logo: row.logo_url || row.logo || "/logo-pidetirua.jpg",
    logo_url: row.logo_url || row.logo || "/logo-pidetirua.jpg",
    abierto: row.abierto !== false,
    activo,
    plan,
    precio_mensual: precioMensual,
    pin: row.pin || "1234",
    categorias: [],
  };

  const categoriasOrdenadas = [...(row.categorias || [])].sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
  );

  const categoriasMapeadas: CategoriaMenu[] =
    categoriasOrdenadas.length > 0
      ? categoriasOrdenadas.map((cat) => {
          const fallbackCat = base.categorias.find((c) => c.id === cat.id);
          const productosOrdenados = [...(cat.productos || [])].sort(
            (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
          );

          const productosMapeados: Producto[] = productosOrdenados.map((p) => {
            const fallbackProd = fallbackCat?.productos.find(
              (fp) => fp.id === p.id
            );
            const img =
              p.imagen_url ||
              fallbackProd?.imagen ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=90";
            return {
              id: p.id,
              categoria_id: cat.id,
              nombre: p.nombre,
              descripcion: p.descripcion ?? fallbackProd?.descripcion ?? "",
              precio: Number(p.precio),
              imagen: img,
              imagen_url: img,
              disponible: p.disponible !== false,
              destacado: p.destacado ?? fallbackProd?.destacado,
              etiqueta: p.etiqueta ?? fallbackProd?.etiqueta,
              es_oferta: Boolean(p.es_oferta ?? fallbackProd?.es_oferta),
              precio_oferta:
                p.precio_oferta != null
                  ? Number(p.precio_oferta)
                  : fallbackProd?.precio_oferta,
              texto_promo:
                p.texto_promo != null
                  ? String(p.texto_promo)
                  : fallbackProd?.texto_promo,
            };
          });

          return {
            id: cat.id,
            local_id: row.id,
            nombre: cat.nombre,
            orden: cat.orden,
            productos: productosMapeados,
          };
        })
      : base.categorias;

  const logoUrlFinal =
    row.logo_url || row.logo || base.logo_url || base.logo || "/logo-pidetirua.jpg";
  const bannerUrlFinal =
    row.banner_url ||
    row.foto_portada ||
    base.banner_url ||
    base.fotoPortada ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=90";

  const bannerVideoUrlFinal =
    row.banner_video_url !== undefined
      ? row.banner_video_url?.trim() || undefined
      : row.video_portada?.trim() ||
        base.banner_video_url ||
        base.videoPortada ||
        undefined;

  const diaCobroFinal =
    typeof row.dia_cobro === "number" &&
    row.dia_cobro >= 1 &&
    row.dia_cobro <= 31
      ? Math.round(row.dia_cobro)
      : base.dia_cobro || 5;

  const fechaUltimoPagoFinal =
    typeof row.fecha_ultimo_pago === "string" && row.fecha_ultimo_pago.trim()
      ? row.fecha_ultimo_pago.slice(0, 10)
      : base.fecha_ultimo_pago || getTodayDateISO();

  return {
    ...base,
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    rubro: row.rubro,
    telefonoWhatsapp: row.telefono_whatsapp || base.telefonoWhatsapp,
    telefono_whatsapp: row.telefono_whatsapp || base.telefonoWhatsapp,
    direccion: row.direccion || base.direccionDetalle,
    direccionDetalle: row.direccion || base.direccionDetalle,
    horario: row.horario || base.horario,
    horarioEntrega: row.horario
      ? `Horario · ${row.horario}`
      : base.horarioEntrega,
    abierto: Boolean(row.abierto),
    activo,
    plan,
    precio_mensual: precioMensual,
    dia_cobro: diaCobroFinal,
    fecha_ultimo_pago: fechaUltimoPagoFinal,
    pin: row.pin || base.pin || "1234",
    banco: row.banco ?? base.banco ?? "",
    tipo_cuenta: row.tipo_cuenta ?? base.tipo_cuenta ?? "",
    numero_cuenta: row.numero_cuenta ?? base.numero_cuenta ?? "",
    rut_titular: row.rut_titular ?? base.rut_titular ?? "",
    nombre_titular: row.nombre_titular ?? base.nombre_titular ?? "",
    email_transferencia:
      row.email_transferencia ?? base.email_transferencia ?? "",
    sector: (row.sector as Local["sector"]) || base.sector,
    ubicacion: row.ubicacion || row.sector || base.ubicacion,
    tiempoEstimado: row.tiempo_estimado || base.tiempoEstimado,
    calificacion: Number(row.calificacion ?? base.calificacion),
    descripcionCorta: row.descripcion_corta || base.descripcionCorta,
    fotoPortada: bannerUrlFinal,
    banner_url: bannerUrlFinal,
    banner_video_url: bannerVideoUrlFinal,
    videoPortada: bannerVideoUrlFinal,
    videoFondo:
      row.banner_video_url !== undefined
        ? bannerVideoUrlFinal
        : bannerVideoUrlFinal || row.video_fondo || base.videoFondo,
    logo: logoUrlFinal,
    logo_url: logoUrlFinal,
    categoriaFiltro:
      (row.categoria_filtro as Local["categoriaFiltro"])?.length
        ? (row.categoria_filtro as Local["categoriaFiltro"])
        : inferCategoriaFiltro(row.rubro, base.categoriaFiltro),
    categorias: categoriasMapeadas,
  };
}

/**
 * Si las tablas relacionales en Supabase existen pero están vacías,
 * inserta automáticamente los locales, categorías y productos iniciales.
 */
async function seedRelationalTablesIfEmpty(): Promise<void> {
  const supabase = getSupabaseClient();
  const initialLocales = getAllLocales();

  const localesRows = initialLocales.map((loc) => ({
    id: loc.id,
    slug: loc.slug,
    nombre: loc.nombre,
    rubro: loc.rubro,
    telefono_whatsapp: loc.telefono_whatsapp || loc.telefonoWhatsapp,
    direccion: loc.direccion || loc.direccionDetalle,
    horario: loc.horario,
    abierto: loc.abierto,
    pin: loc.pin || "1234",
    banco: loc.banco || null,
    tipo_cuenta: loc.tipo_cuenta || null,
    numero_cuenta: loc.numero_cuenta || null,
    rut_titular: loc.rut_titular || null,
    nombre_titular: loc.nombre_titular || null,
    email_transferencia: loc.email_transferencia || null,
    logo_url: loc.logo_url || loc.logo,
    banner_url: loc.banner_url || loc.fotoPortada,
    banner_video_url: loc.banner_video_url || loc.videoPortada || null,
    plan: loc.plan || "autogestionado",
    precio_mensual: loc.precio_mensual || 15000,
    activo: loc.activo !== false,
    dia_cobro: loc.dia_cobro || 5,
    fecha_ultimo_pago: loc.fecha_ultimo_pago || getTodayDateISO(),
    sector: loc.sector,
    ubicacion: loc.ubicacion,
    tiempo_estimado: loc.tiempoEstimado,
    calificacion: loc.calificacion,
    descripcion_corta: loc.descripcionCorta,
    foto_portada: loc.banner_url || loc.fotoPortada,
    video_portada: loc.banner_video_url || loc.videoPortada || "",
    video_fondo: loc.videoFondo || "",
    logo: loc.logo_url || loc.logo,
    categoria_filtro: loc.categoriaFiltro,
  }));

  await supabase.from("locales").upsert(localesRows, { onConflict: "id" });

  const categoriasRows: {
    id: string;
    local_id: string;
    nombre: string;
    orden: number;
  }[] = [];

  const productosRows: {
    id: string;
    categoria_id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen_url: string;
    disponible: boolean;
    destacado: boolean;
    etiqueta: string | null;
    es_oferta?: boolean;
    precio_oferta?: number | null;
    texto_promo?: string | null;
    orden: number;
  }[] = [];

  for (const loc of initialLocales) {
    loc.categorias.forEach((cat, catIdx) => {
      categoriasRows.push({
        id: cat.id,
        local_id: loc.id,
        nombre: cat.nombre,
        orden: cat.orden ?? catIdx + 1,
      });

      cat.productos.forEach((prod, prodIdx) => {
        productosRows.push({
          id: prod.id,
          categoria_id: cat.id,
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          precio: prod.precio,
          imagen_url: prod.imagen_url || prod.imagen,
          disponible: prod.disponible !== false,
          destacado: Boolean(prod.destacado),
          etiqueta: prod.etiqueta ?? null,
          es_oferta: Boolean(prod.es_oferta),
          precio_oferta: prod.precio_oferta ?? null,
          texto_promo: prod.texto_promo ?? null,
          orden: prodIdx + 1,
        });
      });
    });
  }

  await supabase
    .from("categorias")
    .upsert(categoriasRows, { onConflict: "id" });
  await supabase.from("productos").upsert(productosRows, { onConflict: "id" });
}

async function readSupabaseCloudState(): Promise<Local[] | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_STATE_FILE);

    if (error || !data) {
      return null;
    }

    const text = await data.text();
    const parsed = JSON.parse(text) as Local[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizeStaticLocal);
    }
    return null;
  } catch {
    return null;
  }
}

const PLATOS_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
];

export async function ensurePlatosBucketVideoSupport(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data: buckets } = await supabase.storage.listBuckets();
    const existsPlatos = buckets?.some((b) => b.name === PLATOS_IMAGES_BUCKET);
    if (!existsPlatos) {
      await supabase.storage.createBucket(PLATOS_IMAGES_BUCKET, {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: PLATOS_ALLOWED_MIME_TYPES,
      });
    } else {
      await supabase.storage.updateBucket(PLATOS_IMAGES_BUCKET, {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: PLATOS_ALLOWED_MIME_TYPES,
      });
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error configurando bucket",
    };
  }
}

async function writeSupabaseCloudState(locales: Local[]): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { data: buckets } = await supabase.storage.listBuckets();
    const existsDb = buckets?.some((b) => b.name === STORAGE_BUCKET);
    if (!existsDb) {
      await supabase.storage.createBucket(STORAGE_BUCKET, { public: false });
    }
    const existsPlatos = buckets?.some((b) => b.name === PLATOS_IMAGES_BUCKET);
    if (!existsPlatos) {
      await supabase.storage.createBucket(PLATOS_IMAGES_BUCKET, {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: PLATOS_ALLOWED_MIME_TYPES,
      });
    }

    const payload = JSON.stringify(locales, null, 2);
    await supabase.storage.from(STORAGE_BUCKET).upload(
      STORAGE_STATE_FILE,
      new Blob([payload], { type: "application/json" }),
      {
        upsert: true,
        contentType: "application/json",
        cacheControl: "0",
      }
    );
  } catch {
    // Ignorar errores de storage secundario
  }
}

/**
 * Sube una imagen (plato, logo o portada en formato Data URL base64) al bucket público `platos`
 * en Supabase Storage y devuelve su URL pública.
 */
export async function uploadPlatoFotoInSupabase(
  slug: string,
  dataUrl: string,
  fileName = "plato.jpg"
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    await ensurePlatosBucketVideoSupport();

    const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!matches) {
      return { ok: false, error: "Formato de imagen no válido" };
    }

    const contentType = matches[1] || "image/jpeg";
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : "jpg";
    const cleanName = fileName
      .toLowerCase()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9-_]/g, "-")
      .slice(0, 40);

    const filePath = `${slug}/${Date.now()}-${cleanName || "imagen"}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(PLATOS_IMAGES_BUCKET)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
        cacheControl: "31536000",
      });

    if (uploadError) {
      return { ok: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(PLATOS_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    return { ok: true, url: publicUrlData.publicUrl };
  } catch (err) {
    console.error("Error subiendo foto a Supabase Storage:", err);
    return { ok: false, error: "No se pudo subir la imagen a Supabase" };
  }
}

function mergeRowsWithStaticLocales(
  rows: SupabaseLocalRow[],
  staticLocales: Local[]
): Local[] {
  const mappedStatic = staticLocales.map((fallback) => {
    const row = rows.find(
      (r) =>
        r.slug.toLowerCase() === fallback.slug.toLowerCase() ||
        r.id === fallback.id
    );
    return row ? mapSupabaseRowToLocal(row, fallback) : fallback;
  });

  const staticSlugs = new Set(
    staticLocales.map((l) => l.slug.toLowerCase())
  );
  const staticIds = new Set(staticLocales.map((l) => l.id));

  const extraLocals = rows
    .filter(
      (r) =>
        !staticSlugs.has(r.slug.toLowerCase()) && !staticIds.has(r.id)
    )
    .map((r) => mapSupabaseRowToLocal(r));

  return [...mappedStatic, ...extraLocals];
}

/**
 * Obtiene todos los locales (incluyendo activos y suspendidos) con sus categorías y productos desde Supabase.
 */
export async function fetchAllLocales(): Promise<Local[]> {
  const supabase = getSupabaseClient();
  const staticLocales = getAllLocales();

  try {
    const { data, error } = await supabase
      .from("locales")
      .select("*, categorias(*, productos(*))");

    if (!error && Array.isArray(data)) {
      if (data.length === 0) {
        await seedRelationalTablesIfEmpty();
        const { data: seededData } = await supabase
          .from("locales")
          .select("*, categorias(*, productos(*))");
        if (seededData && seededData.length > 0) {
          return mergeRowsWithStaticLocales(
            seededData as SupabaseLocalRow[],
            staticLocales
          );
        }
      } else {
        return mergeRowsWithStaticLocales(
          data as SupabaseLocalRow[],
          staticLocales
        );
      }
    }
  } catch {
    // Continuar con estado sincronizado en Supabase Storage
  }

  const cloudLocales = await readSupabaseCloudState();
  if (cloudLocales) {
    return cloudLocales;
  }

  await writeSupabaseCloudState(staticLocales);
  return staticLocales;
}

/**
 * Obtiene únicamente los locales con `activo: true` para mostrar en el directorio público (`/`).
 */
export async function fetchActiveLocales(): Promise<Local[]> {
  const todos = await fetchAllLocales();
  return todos.filter((loc) => loc.activo !== false);
}

/**
 * Obtiene un local específico por su `slug` desde Supabase.
 */
export async function fetchLocalBySlug(
  slug: string
): Promise<Local | undefined> {
  const locales = await fetchAllLocales();
  return locales.find(
    (local) => local.slug.toLowerCase() === slug.toLowerCase()
  );
}

/**
 * Actualiza el estado `abierto` de un local en Supabase en tiempo real.
 */
export async function updateLocalAbiertoInSupabase(
  slug: string,
  abierto: boolean
): Promise<{ ok: boolean; local?: Local }> {
  const supabase = getSupabaseClient();

  await supabase.from("locales").update({ abierto }).eq("slug", slug);

  const locales = await fetchAllLocales();
  const actualizados = locales.map((loc) =>
    loc.slug.toLowerCase() === slug.toLowerCase() ? { ...loc, abierto } : loc
  );
  await writeSupabaseCloudState(actualizados);

  const localActualizado = actualizados.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );

  return { ok: true, local: localActualizado };
}

/**
 * Actualiza los ajustes básicos operativos del dueño del local:
 * WhatsApp de pedidos, horario de atención, dirección y PIN de 4 dígitos.
 */
export async function updateLocalAjustesBasicosInSupabase(
  slug: string,
  ajustes: {
    telefono_whatsapp?: string;
    horario?: string;
    direccion?: string;
    pin?: string;
  }
): Promise<{ ok: boolean; local?: Local; error?: string }> {
  const supabase = getSupabaseClient();

  const updateRow: Record<string, unknown> = {};
  if (typeof ajustes.telefono_whatsapp === "string" && ajustes.telefono_whatsapp.trim()) {
    const limpio = ajustes.telefono_whatsapp.replace(/\D/g, "");
    updateRow.telefono_whatsapp = limpio || ajustes.telefono_whatsapp.trim();
  }
  if (typeof ajustes.horario === "string" && ajustes.horario.trim()) {
    updateRow.horario = ajustes.horario.trim();
  }
  if (typeof ajustes.direccion === "string" && ajustes.direccion.trim()) {
    updateRow.direccion = ajustes.direccion.trim();
  }
  if (typeof ajustes.pin === "string" && ajustes.pin.trim()) {
    const pinLimpio = ajustes.pin.replace(/\D/g, "").slice(0, 4);
    if (pinLimpio.length !== 4) {
      return { ok: false, error: "El PIN debe tener exactamente 4 dígitos numéricos" };
    }
    updateRow.pin = pinLimpio;
  }

  if (Object.keys(updateRow).length > 0) {
    await supabase.from("locales").update(updateRow).eq("slug", slug);
  }

  const locales = await fetchAllLocales();
  const actualizados = locales.map((loc) => {
    if (loc.slug.toLowerCase() !== slug.toLowerCase()) return loc;
    const nuevoTel =
      typeof updateRow.telefono_whatsapp === "string"
        ? updateRow.telefono_whatsapp
        : loc.telefonoWhatsapp;
    const nuevaDir =
      typeof updateRow.direccion === "string"
        ? updateRow.direccion
        : loc.direccionDetalle;
    const nuevoHorario =
      typeof updateRow.horario === "string" ? updateRow.horario : loc.horario;
    const nuevoPin =
      typeof updateRow.pin === "string" ? updateRow.pin : loc.pin;

    return {
      ...loc,
      telefonoWhatsapp: nuevoTel,
      telefono_whatsapp: nuevoTel,
      direccion: nuevaDir,
      direccionDetalle: nuevaDir,
      horario: nuevoHorario,
      horarioEntrega: `Horario · ${nuevoHorario}`,
      pin: nuevoPin,
    };
  });

  await writeSupabaseCloudState(actualizados);

  const localActualizado = actualizados.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );

  return { ok: true, local: localActualizado };
}

/**
 * Crea una nueva categoría en la carta del local.
 */
export async function createCategoriaInSupabase(
  slug: string,
  nombreCategoria: string
): Promise<{ ok: boolean; local?: Local; error?: string }> {
  const supabase = getSupabaseClient();
  const locales = await fetchAllLocales();
  const localObj = locales.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );
  if (!localObj) {
    return { ok: false, error: "Local no encontrado" };
  }

  const nombreLimpio = nombreCategoria.trim();
  if (!nombreLimpio) {
    return { ok: false, error: "Escribe el nombre de la categoría" };
  }

  const nuevaCatId = `cat-${slug}-${Date.now()}`;
  const nuevoOrden = localObj.categorias.length + 1;

  await supabase.from("categorias").insert({
    id: nuevaCatId,
    local_id: localObj.id,
    nombre: nombreLimpio,
    orden: nuevoOrden,
  });

  const actualizados = locales.map((loc) =>
    loc.slug.toLowerCase() === slug.toLowerCase()
      ? {
          ...loc,
          categorias: [
            ...loc.categorias,
            {
              id: nuevaCatId,
              local_id: loc.id,
              nombre: nombreLimpio,
              orden: nuevoOrden,
              productos: [],
            },
          ],
        }
      : loc
  );

  await writeSupabaseCloudState(actualizados);
  const localActualizado = actualizados.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );
  return { ok: true, local: localActualizado };
}

/**
 * Elimina una categoría de la carta del local.
 */
export async function deleteCategoriaInSupabase(
  slug: string,
  categoriaId: string
): Promise<{ ok: boolean; local?: Local; error?: string }> {
  const supabase = getSupabaseClient();
  await supabase.from("categorias").delete().eq("id", categoriaId);

  const locales = await fetchAllLocales();
  const actualizados = locales.map((loc) =>
    loc.slug.toLowerCase() === slug.toLowerCase()
      ? {
          ...loc,
          categorias: loc.categorias.filter((c) => c.id !== categoriaId),
        }
      : loc
  );

  await writeSupabaseCloudState(actualizados);
  const localActualizado = actualizados.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );
  return { ok: true, local: localActualizado };
}

/**
 * Actualiza los datos bancarios de transferencia de un local en Supabase.
 */
export async function updateLocalDatosBancariosInSupabase(
  slug: string,
  datos: {
    banco: string;
    tipo_cuenta: string;
    numero_cuenta: string;
    rut_titular: string;
    nombre_titular: string;
    email_transferencia: string;
  }
): Promise<{ ok: boolean; local?: Local }> {
  const supabase = getSupabaseClient();

  const payload = {
    banco: datos.banco.trim(),
    tipo_cuenta: datos.tipo_cuenta.trim(),
    numero_cuenta: datos.numero_cuenta.trim(),
    rut_titular: datos.rut_titular.trim(),
    nombre_titular: datos.nombre_titular.trim(),
    email_transferencia: datos.email_transferencia.trim(),
  };

  await supabase.from("locales").update(payload).eq("slug", slug);

  const locales = await fetchAllLocales();
  const actualizados = locales.map((loc) =>
    loc.slug.toLowerCase() === slug.toLowerCase()
      ? { ...loc, ...payload }
      : loc
  );
  await writeSupabaseCloudState(actualizados);

  const localActualizado = actualizados.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );

  return { ok: true, local: localActualizado };
}

/**
 * Actualiza un producto (`nombre`, `descripcion`, `precio`, `disponible`, `imagen_url`, `etiqueta`) en Supabase.
 */
export async function updateProductoInSupabase(
  slug: string,
  productoId: string,
  cambios: {
    nombre?: string;
    descripcion?: string;
    precio?: number;
    disponible?: boolean;
    imagen_url?: string;
    etiqueta?: string;
    es_oferta?: boolean;
    precio_oferta?: number | null;
    texto_promo?: string | null;
  }
): Promise<{ ok: boolean; local?: Local }> {
  const supabase = getSupabaseClient();

  const updatePayload: Record<string, unknown> = {};
  if (typeof cambios.nombre === "string") {
    updatePayload.nombre = cambios.nombre;
  }
  if (typeof cambios.descripcion === "string") {
    updatePayload.descripcion = cambios.descripcion;
  }
  if (typeof cambios.precio === "number" && !Number.isNaN(cambios.precio)) {
    updatePayload.precio = cambios.precio;
  }
  if (typeof cambios.disponible === "boolean") {
    updatePayload.disponible = cambios.disponible;
  }
  if (typeof cambios.imagen_url === "string" && cambios.imagen_url.trim()) {
    updatePayload.imagen_url = cambios.imagen_url.trim();
  }
  if (typeof cambios.etiqueta === "string") {
    updatePayload.etiqueta = cambios.etiqueta.trim() || null;
  }
  if (typeof cambios.es_oferta === "boolean") {
    updatePayload.es_oferta = cambios.es_oferta;
  }
  if (cambios.precio_oferta !== undefined) {
    updatePayload.precio_oferta =
      cambios.precio_oferta != null &&
      !Number.isNaN(Number(cambios.precio_oferta))
        ? Math.round(Number(cambios.precio_oferta))
        : null;
  }
  if (cambios.texto_promo !== undefined) {
    updatePayload.texto_promo =
      cambios.texto_promo?.trim() ? cambios.texto_promo.trim() : null;
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: updErr } = await supabase
      .from("productos")
      .update(updatePayload)
      .eq("id", productoId);

    if (
      updErr &&
      (updErr.code === "42703" || updErr.message?.includes("column"))
    ) {
      const safePayload = { ...updatePayload };
      delete safePayload.es_oferta;
      delete safePayload.precio_oferta;
      delete safePayload.texto_promo;
      if (Object.keys(safePayload).length > 0) {
        await supabase
          .from("productos")
          .update(safePayload)
          .eq("id", productoId);
      }
    }
  }

  const locales = await fetchAllLocales();
  const actualizados = locales.map((loc) => {
    if (loc.slug.toLowerCase() !== slug.toLowerCase()) return loc;
    return {
      ...loc,
      categorias: loc.categorias.map((cat) => ({
        ...cat,
        productos: cat.productos.map((prod) => {
          if (prod.id !== productoId) return prod;
          const nuevaImagen =
            typeof cambios.imagen_url === "string" && cambios.imagen_url.trim()
              ? cambios.imagen_url.trim()
              : prod.imagen;
          return {
            ...prod,
            ...(typeof cambios.nombre === "string"
              ? { nombre: cambios.nombre }
              : {}),
            ...(typeof cambios.descripcion === "string"
              ? { descripcion: cambios.descripcion }
              : {}),
            ...(typeof cambios.precio === "number" &&
            !Number.isNaN(cambios.precio)
              ? { precio: cambios.precio }
              : {}),
            ...(typeof cambios.disponible === "boolean"
              ? { disponible: cambios.disponible }
              : {}),
            ...(typeof cambios.etiqueta === "string"
              ? { etiqueta: cambios.etiqueta.trim() || undefined }
              : {}),
            ...(typeof cambios.es_oferta === "boolean"
              ? { es_oferta: cambios.es_oferta }
              : {}),
            ...(cambios.precio_oferta !== undefined
              ? {
                  precio_oferta:
                    cambios.precio_oferta != null &&
                    !Number.isNaN(Number(cambios.precio_oferta))
                      ? Math.round(Number(cambios.precio_oferta))
                      : undefined,
                }
              : {}),
            ...(cambios.texto_promo !== undefined
              ? {
                  texto_promo: cambios.texto_promo?.trim() || undefined,
                }
              : {}),
            imagen: nuevaImagen,
            imagen_url: nuevaImagen,
          };
        }),
      })),
    };
  });

  await writeSupabaseCloudState(actualizados);

  const localActualizado = actualizados.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );

  return { ok: true, local: localActualizado };
}

/**
 * Crea un nuevo plato (y opcionalmente una nueva categoría) para el local en Supabase.
 */
export async function createProductoInSupabase(
  slug: string,
  datos: {
    categoriaId?: string;
    nuevaCategoriaNombre?: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen_url: string;
    etiqueta?: string;
    disponible?: boolean;
    es_oferta?: boolean;
    precio_oferta?: number;
    texto_promo?: string;
  }
): Promise<{ ok: boolean; local?: Local; error?: string }> {
  const supabase = getSupabaseClient();
  const locales = await fetchAllLocales();
  const localObj = locales.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );

  if (!localObj) {
    return { ok: false, error: "Local no encontrado" };
  }

  let targetCategoriaId = datos.categoriaId || localObj.categorias[0]?.id || "";
  const nombreNuevaCat = datos.nuevaCategoriaNombre?.trim();

  if (nombreNuevaCat || !targetCategoriaId) {
    const catNombreFinal = nombreNuevaCat || "Platos Principales";
    targetCategoriaId = `cat-${slug}-${Date.now()}`;
    const nuevoOrdenCat = localObj.categorias.length + 1;
    await supabase.from("categorias").insert({
      id: targetCategoriaId,
      local_id: localObj.id,
      nombre: catNombreFinal,
      orden: nuevoOrdenCat,
    });
  }

  const nuevoProductoId = `prod-${slug}-${Date.now()}`;
  const imagenFinal =
    datos.imagen_url.trim() ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=90";

  const nuevoProducto: Producto = {
    id: nuevoProductoId,
    categoria_id: targetCategoriaId,
    nombre: datos.nombre.trim(),
    descripcion:
      datos.descripcion.trim() ||
      `Preparación especial de ${localObj.nombre}.`,
    precio: Number(datos.precio),
    imagen: imagenFinal,
    imagen_url: imagenFinal,
    disponible: datos.disponible !== false,
    destacado: Boolean(datos.etiqueta?.trim()),
    ...(datos.etiqueta?.trim() ? { etiqueta: datos.etiqueta.trim() } : {}),
    es_oferta: Boolean(datos.es_oferta),
    ...(typeof datos.precio_oferta === "number" && !Number.isNaN(datos.precio_oferta)
      ? { precio_oferta: Math.round(datos.precio_oferta) }
      : {}),
    ...(datos.texto_promo?.trim() ? { texto_promo: datos.texto_promo.trim() } : {}),
  };

  const insertPayload: Record<string, unknown> = {
    id: nuevoProducto.id,
    categoria_id: targetCategoriaId,
    nombre: nuevoProducto.nombre,
    descripcion: nuevoProducto.descripcion,
    precio: nuevoProducto.precio,
    imagen_url: imagenFinal,
    disponible: nuevoProducto.disponible,
    destacado: Boolean(nuevoProducto.destacado),
    etiqueta: nuevoProducto.etiqueta ?? null,
    es_oferta: Boolean(nuevoProducto.es_oferta),
    precio_oferta: nuevoProducto.precio_oferta ?? null,
    texto_promo: nuevoProducto.texto_promo ?? null,
    orden: 99,
  };

  const { error: insErr } = await supabase.from("productos").insert(insertPayload);
  if (
    insErr &&
    (insErr.code === "42703" || insErr.message?.includes("column"))
  ) {
    delete insertPayload.es_oferta;
    delete insertPayload.precio_oferta;
    delete insertPayload.texto_promo;
    await supabase.from("productos").insert(insertPayload);
  }

  const actualizados = locales.map((loc) => {
    if (loc.slug.toLowerCase() !== slug.toLowerCase()) return loc;

    let categoriasActualizadas = [...loc.categorias];
    const existeCat = categoriasActualizadas.some(
      (c) => c.id === targetCategoriaId
    );
    if (!existeCat) {
      categoriasActualizadas.push({
        id: targetCategoriaId,
        local_id: loc.id,
        nombre: nombreNuevaCat || "Platos Principales",
        orden: categoriasActualizadas.length + 1,
        productos: [nuevoProducto],
      });
    } else {
      categoriasActualizadas = categoriasActualizadas.map((cat) =>
        cat.id === targetCategoriaId
          ? { ...cat, productos: [nuevoProducto, ...cat.productos] }
          : cat
      );
    }

    return {
      ...loc,
      categorias: categoriasActualizadas,
    };
  });

  await writeSupabaseCloudState(actualizados);

  const localActualizado = actualizados.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );

  return { ok: true, local: localActualizado };
}

/**
 * Elimina un producto del local en Supabase.
 */
export async function deleteProductoInSupabase(
  slug: string,
  productoId: string
): Promise<{ ok: boolean; local?: Local }> {
  const supabase = getSupabaseClient();

  await supabase.from("productos").delete().eq("id", productoId);

  const locales = await fetchAllLocales();
  const actualizados = locales.map((loc) => {
    if (loc.slug.toLowerCase() !== slug.toLowerCase()) return loc;
    return {
      ...loc,
      categorias: loc.categorias.map((cat) => ({
        ...cat,
        productos: cat.productos.filter((p) => p.id !== productoId),
      })),
    };
  });

  await writeSupabaseCloudState(actualizados);

  const localActualizado = actualizados.find(
    (loc) => loc.slug.toLowerCase() === slug.toLowerCase()
  );

  return { ok: true, local: localActualizado };
}

/**
 * Valida el PIN de 4 dígitos del local contra Supabase.
 */
export async function verifyLocalPinInSupabase(
  slug: string,
  pinIngresado: string
): Promise<boolean> {
  const local = await fetchLocalBySlug(slug);
  if (!local) return false;
  const pinEsperado = (local.pin || "1234").trim();
  return timingSafeCompare(pinIngresado.trim(), pinEsperado);
}

/**
 * SuperAdmin: Activa o suspende un local (`activo: true | false`) en Supabase.
 */
export async function toggleLocalActivoBySuperAdminInSupabase(
  slug: string,
  activo: boolean
): Promise<{ ok: boolean; locales?: Local[]; error?: string }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("locales")
    .update({ activo })
    .eq("slug", slug);

  if (error) {
    console.error("Error actualizando activo en locales:", error);
  }

  const locales = await fetchAllLocales();
  const actualizados = locales.map((loc) =>
    loc.slug.toLowerCase() === slug.toLowerCase() ? { ...loc, activo } : loc
  );
  await writeSupabaseCloudState(actualizados);

  return { ok: true, locales: actualizados };
}

/**
 * SuperAdmin: Actualiza de forma inmediata el PIN de 4 dígitos de un local en Supabase.
 */
export async function updateLocalPinBySuperAdminInSupabase(
  slug: string,
  nuevoPin: string
): Promise<{ ok: boolean; locales?: Local[]; error?: string }> {
  const pinLimpio = nuevoPin.replace(/\D/g, "").slice(0, 4);
  if (pinLimpio.length !== 4) {
    return {
      ok: false,
      error: "El PIN debe contener exactamente 4 dígitos numéricos.",
    };
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("locales")
    .update({ pin: pinLimpio })
    .eq("slug", slug);

  if (error) {
    console.error("Error actualizando PIN en locales:", error);
  }

  const locales = await fetchAllLocales();
  const actualizados = locales.map((loc) =>
    loc.slug.toLowerCase() === slug.toLowerCase()
      ? { ...loc, pin: pinLimpio }
      : loc
  );
  await writeSupabaseCloudState(actualizados);

  return { ok: true, locales: actualizados };
}

/**
 * SuperAdmin: Registra un nuevo local o actualiza uno existente (incluyendo Logo, Banner y Plan).
 */
export async function upsertLocalBySuperAdminInSupabase(input: {
  id?: string;
  originalSlug?: string;
  nombre: string;
  slug: string;
  rubro: string;
  sector?: SectorComuna;
  telefono_whatsapp: string;
  direccion: string;
  horario?: string;
  pin: string;
  plan: PlanComercial;
  precio_mensual?: number;
  logo_url?: string;
  banner_url?: string;
  banner_video_url?: string | null;
  activo?: boolean;
  dia_cobro?: number;
  fecha_ultimo_pago?: string;
}): Promise<{ ok: boolean; locales?: Local[]; local?: Local; error?: string }> {
  const supabase = getSupabaseClient();
  const todos = await fetchAllLocales();

  const slugLimpio = input.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slugLimpio) {
    return { ok: false, error: "El slug del local no es válido" };
  }

  const existing = todos.find(
    (l) =>
      (input.id && l.id === input.id) ||
      (input.originalSlug &&
        l.slug.toLowerCase() === input.originalSlug.toLowerCase()) ||
      l.slug.toLowerCase() === slugLimpio
  );

  const localId = existing?.id || `loc-${Date.now()}`;
  const plan: PlanComercial =
    input.plan === "llave_en_mano" ? "llave_en_mano" : "autogestionado";
  const precioMensual =
    typeof input.precio_mensual === "number" && input.precio_mensual > 0
      ? input.precio_mensual
      : plan === "llave_en_mano"
      ? 28000
      : 15000;

  const logoFinal =
    input.logo_url?.trim() ||
    existing?.logo_url ||
    existing?.logo ||
    "/logo-pidetirua.jpg";

  const bannerFinal =
    input.banner_url?.trim() ||
    existing?.banner_url ||
    existing?.fotoPortada ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=90";

  const bannerVideoFinal =
    input.banner_video_url !== undefined
      ? input.banner_video_url?.trim() || null
      : existing?.banner_video_url || existing?.videoPortada || null;

  const telefonoLimpio =
    input.telefono_whatsapp.replace(/\D/g, "") || "56912345678";
  const pinLimpio =
    input.pin.replace(/\D/g, "").slice(0, 4).padStart(4, "0") || "1234";
  const sectorFinal: SectorComuna =
    input.sector === "Quidico" ? "Quidico" : existing?.sector || "Tirúa Centro";
  const horarioFinal =
    input.horario?.trim() || existing?.horario || "12:00 a 22:30 hrs";
  const activoFinal =
    typeof input.activo === "boolean"
      ? input.activo
      : existing?.activo !== false;

  const diaCobroFinal =
    typeof input.dia_cobro === "number" &&
    input.dia_cobro >= 1 &&
    input.dia_cobro <= 31
      ? Math.round(input.dia_cobro)
      : existing?.dia_cobro || 5;

  const fechaUltimoPagoFinal =
    typeof input.fecha_ultimo_pago === "string" &&
    input.fecha_ultimo_pago.trim()
      ? input.fecha_ultimo_pago.slice(0, 10)
      : existing?.fecha_ultimo_pago || getTodayDateISO();

  const rowToUpsert = {
    id: localId,
    slug: slugLimpio,
    nombre: input.nombre.trim(),
    rubro: input.rubro.trim() || "Gastronomía Local",
    telefono_whatsapp: telefonoLimpio,
    direccion: input.direccion.trim() || "Tirúa",
    horario: horarioFinal,
    abierto: existing ? existing.abierto : true,
    pin: pinLimpio,
    plan,
    precio_mensual: precioMensual,
    activo: activoFinal,
    dia_cobro: diaCobroFinal,
    fecha_ultimo_pago: fechaUltimoPagoFinal,
    logo: logoFinal,
    logo_url: logoFinal,
    foto_portada: bannerFinal,
    banner_url: bannerFinal,
    banner_video_url: bannerVideoFinal,
    video_portada: bannerVideoFinal || "",
    video_fondo: bannerVideoFinal || "",
    sector: sectorFinal,
    ubicacion: sectorFinal,
    tiempo_estimado: existing?.tiempoEstimado || "25 - 35 min",
    calificacion: existing?.calificacion || 4.9,
    descripcion_corta:
      existing?.descripcionCorta ||
      `Bienvenido a la carta digital de ${input.nombre.trim()} en PideTirúa.`,
    categoria_filtro: inferCategoriaFiltro(
      input.rubro,
      existing?.categoriaFiltro
    ),
  };

  const { error: upsertErr } = await supabase
    .from("locales")
    .upsert(rowToUpsert, { onConflict: "id" });

  if (upsertErr) {
    console.error("Error en upsertLocalBySuperAdminInSupabase:", upsertErr);
    return { ok: false, error: upsertErr.message };
  }

  // Si es un local nuevo sin categorías, crear una categoría inicial por defecto
  if (!existing || existing.categorias.length === 0) {
    const catInicialId = `cat-${slugLimpio}-1`;
    await supabase.from("categorias").upsert(
      {
        id: catInicialId,
        local_id: localId,
        nombre: "Especialidades de la Casa",
        orden: 1,
      },
      { onConflict: "id" }
    );
  }

  const localesActualizados = await fetchAllLocales();
  await writeSupabaseCloudState(localesActualizados);

  const localGuardado = localesActualizados.find(
    (l) => l.slug.toLowerCase() === slugLimpio
  );

  return {
    ok: true,
    locales: localesActualizados,
    local: localGuardado,
  };
}

/**
 * SuperAdmin: Registra el pago mensual de un local actualizando `fecha_ultimo_pago` a la fecha de hoy en Supabase.
 */
export async function registerLocalPagoBySuperAdminInSupabase(
  slug: string,
  fechaPago?: string
): Promise<{ ok: boolean; locales?: Local[]; error?: string }> {
  const fechaFinal =
    typeof fechaPago === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fechaPago.trim())
      ? fechaPago.trim()
      : getTodayDateISO();

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("locales")
    .update({ fecha_ultimo_pago: fechaFinal })
    .eq("slug", slug);

  if (error) {
    console.error("Error actualizando fecha_ultimo_pago en locales:", error);
    return { ok: false, error: error.message };
  }

  const locales = await fetchAllLocales();
  const actualizados = locales.map((loc) =>
    loc.slug.toLowerCase() === slug.toLowerCase()
      ? { ...loc, fecha_ultimo_pago: fechaFinal }
      : loc
  );
  await writeSupabaseCloudState(actualizados);

  return { ok: true, locales: actualizados };
}

