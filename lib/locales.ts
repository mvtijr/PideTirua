import localesData from "@/data/locales.json";
import { CategoriaFiltro, CategoriaMenu, Local, Producto } from "@/types/local";
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

function normalizeStaticLocal(raw: Local): Local {
  return {
    ...raw,
    pin: raw.pin || "1234",
    direccion: raw.direccion || raw.direccionDetalle,
    telefono_whatsapp: raw.telefono_whatsapp || raw.telefonoWhatsapp,
    categorias: raw.categorias.map((cat, idx) => ({
      ...cat,
      local_id: raw.id,
      orden: cat.orden ?? idx + 1,
      productos: cat.productos.map((prod) => ({
        ...prod,
        categoria_id: cat.id,
        imagen: prod.imagen_url || prod.imagen,
        imagen_url: prod.imagen_url || prod.imagen,
        disponible: prod.disponible !== false,
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

function mapSupabaseRowToLocal(
  row: SupabaseLocalRow,
  fallback?: Local
): Local {
  const base = fallback || {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    rubro: row.rubro,
    categoriaFiltro: ["Comida Rápida"] as Exclude<CategoriaFiltro, "Todos">[],
    sector: "Tirúa Centro" as const,
    ubicacion: "Tirúa Centro",
    direccion: row.direccion,
    direccionDetalle: row.direccion,
    telefonoWhatsapp: row.telefono_whatsapp,
    telefono_whatsapp: row.telefono_whatsapp,
    horario: row.horario,
    horarioEntrega: `Lun a Dom · ${row.horario}`,
    tiempoEstimado: "25 - 35 min",
    calificacion: 4.9,
    descripcionCorta: "",
    fotoPortada: "",
    logo: "/logo-pidetirua.jpg",
    abierto: row.abierto,
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
    pin: row.pin || base.pin || "1234",
    sector: (row.sector as Local["sector"]) || base.sector,
    ubicacion: row.ubicacion || base.ubicacion,
    tiempoEstimado: row.tiempo_estimado || base.tiempoEstimado,
    calificacion: Number(row.calificacion ?? base.calificacion),
    descripcionCorta: row.descripcion_corta || base.descripcionCorta,
    fotoPortada: row.foto_portada || base.fotoPortada,
    videoPortada: row.video_portada || base.videoPortada,
    videoFondo: row.video_fondo || base.videoFondo,
    logo: row.logo || base.logo,
    categoriaFiltro:
      (row.categoria_filtro as Local["categoriaFiltro"])?.length
        ? (row.categoria_filtro as Local["categoriaFiltro"])
        : base.categoriaFiltro,
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
    sector: loc.sector,
    ubicacion: loc.ubicacion,
    tiempo_estimado: loc.tiempoEstimado,
    calificacion: loc.calificacion,
    descripcion_corta: loc.descripcionCorta,
    foto_portada: loc.fotoPortada,
    video_portada: loc.videoPortada || "",
    video_fondo: loc.videoFondo || "",
    logo: loc.logo,
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

/**
 * Respaldo en vivo en Supabase Storage para garantizar persistencia inmediata en la nube
 * incluso si el administrador aún no ha ejecutado supabase/schema.sql en el SQL Editor.
 */
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
 * Sube una imagen de plato (en formato Data URL base64) al bucket público `platos`
 * en Supabase Storage y devuelve su URL pública lista para usar en la carta digital.
 */
export async function uploadPlatoFotoInSupabase(
  slug: string,
  dataUrl: string,
  fileName = "plato.jpg"
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Asegurar que exista el bucket público `platos`
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === PLATOS_IMAGES_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(PLATOS_IMAGES_BUCKET, {
        public: true,
      });
    }

    // Extraer mimeType y bytes desde el Data URL base64
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

    const filePath = `${slug}/${Date.now()}-${cleanName || "plato"}.${ext}`;

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

/**
 * Obtiene todos los locales con sus categorías y productos desde Supabase.
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
          return staticLocales.map((fallback) => {
            const row = (seededData as SupabaseLocalRow[]).find(
              (r) => r.slug === fallback.slug || r.id === fallback.id
            );
            return row ? mapSupabaseRowToLocal(row, fallback) : fallback;
          });
        }
      } else {
        return staticLocales.map((fallback) => {
          const row = (data as SupabaseLocalRow[]).find(
            (r) => r.slug === fallback.slug || r.id === fallback.id
          );
          return row ? mapSupabaseRowToLocal(row, fallback) : fallback;
        });
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

  // 1. Actualizar tabla `locales` en Supabase PostgreSQL
  await supabase.from("locales").update({ abierto }).eq("slug", slug);

  // 2. Sincronizar estado en Supabase Cloud Storage
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
  }
): Promise<{ ok: boolean; local?: Local }> {
  const supabase = getSupabaseClient();

  // 1. Actualizar tabla `productos` en Supabase PostgreSQL
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

  if (Object.keys(updatePayload).length > 0) {
    await supabase
      .from("productos")
      .update(updatePayload)
      .eq("id", productoId);
  }

  // 2. Sincronizar estado en Supabase Cloud Storage
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

  // Si el dueño escribió una categoría nueva, crearla primero
  if (nombreNuevaCat) {
    targetCategoriaId = `cat-${slug}-${Date.now()}`;
    const nuevoOrdenCat = localObj.categorias.length + 1;
    await supabase.from("categorias").insert({
      id: targetCategoriaId,
      local_id: localObj.id,
      nombre: nombreNuevaCat,
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
  };

  // 1. Insertar en tabla `productos` de Supabase PostgreSQL
  await supabase.from("productos").insert({
    id: nuevoProducto.id,
    categoria_id: targetCategoriaId,
    nombre: nuevoProducto.nombre,
    descripcion: nuevoProducto.descripcion,
    precio: nuevoProducto.precio,
    imagen_url: imagenFinal,
    disponible: nuevoProducto.disponible,
    destacado: Boolean(nuevoProducto.destacado),
    etiqueta: nuevoProducto.etiqueta ?? null,
    orden: 99,
  });

  // 2. Sincronizar estado en Supabase Cloud Storage
  const actualizados = locales.map((loc) => {
    if (loc.slug.toLowerCase() !== slug.toLowerCase()) return loc;

    let categoriasActualizadas = [...loc.categorias];
    if (nombreNuevaCat) {
      categoriasActualizadas.push({
        id: targetCategoriaId,
        local_id: loc.id,
        nombre: nombreNuevaCat,
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

  // 1. Eliminar de tabla `productos` en Supabase PostgreSQL
  await supabase.from("productos").delete().eq("id", productoId);

  // 2. Sincronizar en Supabase Cloud Storage
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
  return pinIngresado.trim() === pinEsperado;
}
