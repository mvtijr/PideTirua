-- ============================================================================
-- PideTirúa — Esquema de Base de Datos y Storage en Supabase (PostgreSQL)
-- Tablas: locales (con datos bancarios), categorias, productos (con etiqueta)
-- Storage: Bucket público `platos` con políticas SELECT, INSERT y UPDATE
-- ============================================================================

-- 1. Tabla de Locales
CREATE TABLE IF NOT EXISTS public.locales (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rubro TEXT NOT NULL,
  telefono_whatsapp TEXT NOT NULL,
  direccion TEXT NOT NULL,
  horario TEXT NOT NULL,
  abierto BOOLEAN NOT NULL DEFAULT true,
  pin VARCHAR(4) NOT NULL DEFAULT '1234',
  banco TEXT NULL,
  tipo_cuenta TEXT NULL,
  numero_cuenta TEXT NULL,
  rut_titular TEXT NULL,
  nombre_titular TEXT NULL,
  email_transferencia TEXT NULL,
  sector TEXT DEFAULT 'Tirúa Centro',
  ubicacion TEXT DEFAULT 'Tirúa Centro',
  tiempo_estimado TEXT DEFAULT '25 - 35 min',
  calificacion NUMERIC(3,1) DEFAULT 4.9,
  descripcion_corta TEXT DEFAULT '',
  foto_portada TEXT DEFAULT '',
  video_portada TEXT DEFAULT '',
  video_fondo TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  categoria_filtro TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar que las columnas de datos bancarios existan en `public.locales`
ALTER TABLE public.locales
  ADD COLUMN IF NOT EXISTS banco TEXT NULL,
  ADD COLUMN IF NOT EXISTS tipo_cuenta TEXT NULL,
  ADD COLUMN IF NOT EXISTS numero_cuenta TEXT NULL,
  ADD COLUMN IF NOT EXISTS rut_titular TEXT NULL,
  ADD COLUMN IF NOT EXISTS nombre_titular TEXT NULL,
  ADD COLUMN IF NOT EXISTS email_transferencia TEXT NULL;

-- 2. Tabla de Categorías
CREATE TABLE IF NOT EXISTS public.categorias (
  id TEXT PRIMARY KEY,
  local_id TEXT NOT NULL REFERENCES public.locales(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Productos (incluyendo columna `etiqueta` nullable)
CREATE TABLE IF NOT EXISTS public.productos (
  id TEXT PRIMARY KEY,
  categoria_id TEXT NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio INTEGER NOT NULL,
  imagen_url TEXT NOT NULL DEFAULT '',
  disponible BOOLEAN NOT NULL DEFAULT true,
  destacado BOOLEAN NOT NULL DEFAULT false,
  etiqueta TEXT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar que la columna `etiqueta` exista en `public.productos` (nullable)
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS etiqueta TEXT NULL;

-- Índices para consultas rápidas por slug y relaciones
CREATE INDEX IF NOT EXISTS idx_locales_slug ON public.locales(slug);
CREATE INDEX IF NOT EXISTS idx_categorias_local_id ON public.categorias(local_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON public.productos(categoria_id);

-- Permisos y políticas RLS abiertas para lectura pública y administración
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total locales" ON public.locales;
CREATE POLICY "Permitir acceso total locales"
  ON public.locales FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acceso total categorias" ON public.categorias;
CREATE POLICY "Permitir acceso total categorias"
  ON public.categorias FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acceso total productos" ON public.productos;
CREATE POLICY "Permitir acceso total productos"
  ON public.productos FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. Bucket `platos` y Políticas de Storage (SELECT, INSERT, UPDATE)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('platos', 'platos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Permitir SELECT en bucket platos" ON storage.objects;
CREATE POLICY "Permitir SELECT en bucket platos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'platos');

DROP POLICY IF EXISTS "Permitir INSERT en bucket platos" ON storage.objects;
CREATE POLICY "Permitir INSERT en bucket platos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'platos');

DROP POLICY IF EXISTS "Permitir UPDATE en bucket platos" ON storage.objects;
CREATE POLICY "Permitir UPDATE en bucket platos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'platos')
  WITH CHECK (bucket_id = 'platos');

DROP POLICY IF EXISTS "Permitir DELETE en bucket platos" ON storage.objects;
CREATE POLICY "Permitir DELETE en bucket platos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'platos');
