-- Ejecuta este comando en el SQL Editor de Supabase
-- Esto añadirá las columnas "mes" y "anio" a las metas existentes
-- y por defecto las asignará al mes/año actual para que no se rompan.

ALTER TABLE public.metas 
ADD COLUMN IF NOT EXISTS mes integer NOT NULL DEFAULT extract(month from now()) - 1,
ADD COLUMN IF NOT EXISTS anio integer NOT NULL DEFAULT extract(year from now());
