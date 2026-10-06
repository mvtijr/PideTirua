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
  banner_url TEXT DEFAULT '',
  banner_video_url TEXT NULL,
  video_portada TEXT DEFAULT '',
  video_fondo TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'autogestionado'
    CHECK (plan IN ('autogestionado', 'llave_en_mano')),
  precio_mensual INTEGER NOT NULL DEFAULT 15000,
  activo BOOLEAN NOT NULL DEFAULT true,
  dia_cobro INTEGER NOT NULL DEFAULT 5,
  fecha_ultimo_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria_filtro TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar que las columnas de datos bancarios, identidad visual, video de portada, planes y cobranza existan en `public.locales`
ALTER TABLE public.locales
  ADD COLUMN IF NOT EXISTS banco TEXT NULL,
  ADD COLUMN IF NOT EXISTS tipo_cuenta TEXT NULL,
  ADD COLUMN IF NOT EXISTS numero_cuenta TEXT NULL,
  ADD COLUMN IF NOT EXISTS rut_titular TEXT NULL,
  ADD COLUMN IF NOT EXISTS nombre_titular TEXT NULL,
  ADD COLUMN IF NOT EXISTS email_transferencia TEXT NULL,
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_video_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'autogestionado',
  ADD COLUMN IF NOT EXISTS precio_mensual INTEGER NOT NULL DEFAULT 15000,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dia_cobro INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS fecha_ultimo_pago DATE DEFAULT CURRENT_DATE;

UPDATE public.locales
SET banner_video_url = NULLIF(video_portada, '')
WHERE banner_video_url IS NULL
  AND video_portada IS NOT NULL
  AND video_portada <> '';

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
  es_oferta BOOLEAN NOT NULL DEFAULT false,
  precio_oferta INTEGER NULL,
  texto_promo TEXT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar que las columnas de etiqueta y ofertas existan en `public.productos`
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS etiqueta TEXT NULL,
  ADD COLUMN IF NOT EXISTS es_oferta BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS precio_oferta INTEGER NULL,
  ADD COLUMN IF NOT EXISTS texto_promo TEXT NULL;

-- Índices para consultas rápidas por slug y relaciones
CREATE INDEX IF NOT EXISTS idx_locales_slug ON public.locales(slug);
CREATE INDEX IF NOT EXISTS idx_categorias_local_id ON public.categorias(local_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON public.productos(categoria_id);

-- ============================================================================
-- Permisos y políticas RLS Definitivas (Principio de Mínimo Privilegio)
-- Lectura pública para la carta; mutaciones restringidas a service_role
-- ============================================================================
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total locales" ON public.locales;
DROP POLICY IF EXISTS "Lectura publica locales" ON public.locales;
DROP POLICY IF EXISTS "Gestion total locales service_role" ON public.locales;

CREATE POLICY "Lectura publica locales"
  ON public.locales FOR SELECT
  USING (true);

CREATE POLICY "Gestion total locales service_role"
  ON public.locales FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acceso total categorias" ON public.categorias;
DROP POLICY IF EXISTS "Lectura publica categorias" ON public.categorias;
DROP POLICY IF EXISTS "Gestion total categorias service_role" ON public.categorias;

CREATE POLICY "Lectura publica categorias"
  ON public.categorias FOR SELECT
  USING (true);

CREATE POLICY "Gestion total categorias service_role"
  ON public.categorias FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acceso total productos" ON public.productos;
DROP POLICY IF EXISTS "Lectura publica productos" ON public.productos;
DROP POLICY IF EXISTS "Gestion total productos service_role" ON public.productos;

CREATE POLICY "Lectura publica productos"
  ON public.productos FOR SELECT
  USING (true);

CREATE POLICY "Gestion total productos service_role"
  ON public.productos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. Bucket `platos` y Políticas de Storage (SELECT, INSERT, UPDATE)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platos',
  'platos',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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

-- ============================================================================
-- 5. Tabla: pedidos (Monitor de Cocina en Tiempo Real / KDS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  local_slug TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  tipo_entrega TEXT NOT NULL,
  direccion_mesa TEXT NOT NULL DEFAULT '',
  metodo_pago TEXT NOT NULL,
  notas TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_pedidos_local_slug_created
  ON public.pedidos(local_slug, created_at DESC);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso total pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Creacion anonima de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Gestion total pedidos service_role" ON public.pedidos;

-- 1. Clientes anónimos desde el Checkout pueden insertar nuevos pedidos
CREATE POLICY "Creacion anonima de pedidos"
  ON public.pedidos FOR INSERT
  WITH CHECK (true);

-- 2. Solo el rol administrativo (service_role) o backend autenticado puede leer y gestionar pedidos
-- Esto previene fugas de datos masivas donde curiosos o bots lean pedidos vecinales
CREATE POLICY "Gestion total pedidos service_role"
  ON public.pedidos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.pedidos REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pedidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
  END IF;
END $$;

