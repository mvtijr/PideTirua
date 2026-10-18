-- ==============================================================================
-- SCRIPT DE BLINDAJE Y POLÍTICAS RLS PARA SUPABASE: TABLA PEDIDOS (PIDETIRÚA)
-- ==============================================================================
-- Propósito:
-- 1. Garantizar que clientes anónimos puedan enviar órdenes desde el Checkout
--    sin requerir autenticación previa.
-- 2. Permitir que clientes y monitores de cocina (KDS) escuchen eventos en Realtime
--    sin que Supabase bloquee la transmisión de payloads por RLS.
-- 3. Mantener acceso administrativo total para el rol de servicio (service_role).
-- ==============================================================================

-- 1. Asegurar que la tabla pedidos exista con su estructura completa
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  local_slug TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  tipo_entrega TEXT NOT NULL,
  direccion_mesa TEXT NOT NULL,
  metodo_pago TEXT NOT NULL,
  notas TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado'))
);

-- Índice de rendimiento para consultas y orden cronológico
CREATE INDEX IF NOT EXISTS idx_pedidos_local_slug_created
  ON public.pedidos(local_slug, created_at DESC);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- 3. Limpieza preventiva de políticas anteriores para evitar conflictos de nombres
DROP POLICY IF EXISTS "Permitir acceso total pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Creacion anonima de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir insertar pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir lectura realtime pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Gestion total pedidos service_role" ON public.pedidos;

-- 4. POLÍTICA DE INSERCIÓN PÚBLICA (Checkout de clientes anónimos y autenticados)
-- Permite que cualquier cliente que presione "Enviar pedido a WhatsApp" registre
-- la comanda en la base de datos para el monitor de cocina en tiempo real.
CREATE POLICY "Permitir insertar pedidos"
  ON public.pedidos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. POLÍTICA DE LECTURA PARA REALTIME (Monitor de cocina y seguimiento)
-- Supabase Realtime requiere que el rol anon/authenticated tenga permisos de SELECT
-- para emitir los registros a los canales de websocket sin silenciarlos.
CREATE POLICY "Permitir lectura realtime pedidos"
  ON public.pedidos FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. POLÍTICA DE GESTIÓN ADMINISTRATIVA TOTAL (service_role)
-- Permite a las APIs de servidor con service_role actualizar estados y borrar registros.
CREATE POLICY "Gestion total pedidos service_role"
  ON public.pedidos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. Configuración de REPLICA IDENTITY FULL para capturar el registro completo en Realtime
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;

-- 8. Publicación en el canal Supabase Realtime
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

-- Verificación final: Mostrar las políticas activas
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'pedidos';
