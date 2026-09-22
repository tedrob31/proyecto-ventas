-- ==========================================
-- SCRIPT DE BASE DE DATOS COMPLETO - STOCKPREMIUM
-- ==========================================
-- Esquema consolidado y sincronizado con la base de datos de producción.
-- Incluye: usuarios, login_logs, productos, metas, meta_tiers, ventas,
-- venta_detalles, ranking_historial y reportes_mensuales.

-- ==========================================
-- 1. TABLA DE USUARIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  pin text NOT NULL,
  rol text NOT NULL DEFAULT 'asesora',
  celular text NULL,
  estado text NOT NULL DEFAULT 'activo',
  meta_id uuid NULL,
  fecha_creacion timestamp with time zone NULL DEFAULT now(),
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ==========================================
-- 2. TABLA DE LOGS DE ACCESO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NULL,
  nombre_usuario text NOT NULL,
  fecha timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT login_logs_pkey PRIMARY KEY (id),
  CONSTRAINT login_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ==========================================
-- 3. TABLA DE PRODUCTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.productos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  proveedor text NOT NULL,
  codigo text NOT NULL,
  numero integer NOT NULL,
  nombre text NOT NULL,
  precio numeric NOT NULL DEFAULT 0,
  precio_costo numeric NOT NULL DEFAULT 0,
  precio_liquidacion numeric NOT NULL DEFAULT 0,
  fecha timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT productos_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ==========================================
-- 4. TABLA DE METAS (HISTORIAL POR MES)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.metas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  metric text NOT NULL, -- 'ordenes', 'prendas', 'monto'
  target numeric NOT NULL DEFAULT 0,
  mes integer NOT NULL DEFAULT (extract(month from now())::integer - 1),
  anio integer NOT NULL DEFAULT (extract(year from now())::integer),
  is_active boolean NOT NULL DEFAULT true,
  has_tiers boolean NOT NULL DEFAULT false,
  CONSTRAINT metas_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.meta_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meta_id uuid NOT NULL,
  name text NOT NULL,
  target numeric NOT NULL DEFAULT 0,
  CONSTRAINT meta_tiers_pkey PRIMARY KEY (id),
  CONSTRAINT meta_tiers_meta_id_fkey FOREIGN KEY (meta_id) REFERENCES public.metas (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ==========================================
-- 5. TABLA DE VENTAS (CABECERA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ventas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_venta timestamp with time zone NOT NULL DEFAULT now(),
  asesora_nombre text NOT NULL,
  celular_cliente text NULL,
  informacion_adicional text NULL,
  embalaje numeric NOT NULL DEFAULT 0,
  delivery numeric NOT NULL DEFAULT 0,
  envio numeric NOT NULL DEFAULT 0,
  descuento numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'completado', -- 'completado', 'anulado'
  CONSTRAINT ventas_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ==========================================
-- 6. TABLA DE DETALLES DE VENTA
-- ==========================================
CREATE TABLE IF NOT EXISTS public.venta_detalles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_aplicado numeric NOT NULL DEFAULT 0,
  costo_aplicado numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  CONSTRAINT venta_detalles_pkey PRIMARY KEY (id),
  CONSTRAINT venta_detalles_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas (id) ON DELETE CASCADE,
  CONSTRAINT venta_detalles_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos (id) ON DELETE RESTRICT
) TABLESPACE pg_default;

-- ==========================================
-- 7. TABLA DE HISTORIAL DE RANKING
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ranking_historial (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mes integer NOT NULL,
  anio integer NOT NULL,
  asesora_nombre text NOT NULL,
  prendas integer NOT NULL DEFAULT 0,
  ingresos numeric NOT NULL DEFAULT 0,
  ordenes integer NOT NULL DEFAULT 0,
  crecimiento_prendas numeric NOT NULL DEFAULT 0,
  fecha_guardado timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT ranking_historial_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ==========================================
-- 8. TABLA DE REPORTES MENSUALES (ROLLUP)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reportes_mensuales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mes integer NOT NULL,
  anio integer NOT NULL,
  ingresos numeric NOT NULL DEFAULT 0,
  ganancia_neta numeric NOT NULL DEFAULT 0,
  prendas_vendidas integer NOT NULL DEFAULT 0,
  ordenes integer NOT NULL DEFAULT 0,
  CONSTRAINT reportes_mensuales_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ==========================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_mensuales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'Enable all for usuarios') THEN
    CREATE POLICY "Enable all for usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'login_logs' AND policyname = 'Enable all for login_logs') THEN
    CREATE POLICY "Enable all for login_logs" ON public.login_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'productos' AND policyname = 'Enable all for productos') THEN
    CREATE POLICY "Enable all for productos" ON public.productos FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metas' AND policyname = 'Enable all for metas') THEN
    CREATE POLICY "Enable all for metas" ON public.metas FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_tiers' AND policyname = 'Enable all for meta_tiers') THEN
    CREATE POLICY "Enable all for meta_tiers" ON public.meta_tiers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ventas' AND policyname = 'Enable all for ventas') THEN
    CREATE POLICY "Enable all for ventas" ON public.ventas FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'venta_detalles' AND policyname = 'Enable all for venta_detalles') THEN
    CREATE POLICY "Enable all for venta_detalles" ON public.venta_detalles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ranking_historial' AND policyname = 'Enable all for ranking_historial') THEN
    CREATE POLICY "Enable all for ranking_historial" ON public.ranking_historial FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reportes_mensuales' AND policyname = 'Enable all for reportes_mensuales') THEN
    CREATE POLICY "Enable all for reportes_mensuales" ON public.reportes_mensuales FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==========================================
-- USUARIO ADMINISTRADOR INICIAL
-- ==========================================
INSERT INTO public.usuarios (nombre, pin, rol, celular, estado)
VALUES ('admin', '1234', 'admin', '999999999', 'activo')
ON CONFLICT DO NOTHING;
