-- 1. Fix bucket leitura-fotos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leitura-fotos',
  'leitura-fotos',
  false,
  10485760,  -- 10MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Create/recreate policies for leitura-fotos
DROP POLICY IF EXISTS "leitura_fotos_select_role" ON storage.objects;
CREATE POLICY "leitura_fotos_select_role" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'leitura-fotos' 
    AND (
      has_role(auth.uid(), 'master')
      OR has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.leitura_fotos lf
        JOIN public.leituras l ON l.id = lf.leitura_id
        WHERE l.usuario_id = auth.uid()
          AND lf.foto_url LIKE '%' || storage.objects.name || '%'
      )
    )
  );

DROP POLICY IF EXISTS "leitura_fotos_insert_authenticated" ON storage.objects;
CREATE POLICY "leitura_fotos_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'leitura-fotos');

-- 2. Consolidate comprovantes buckets
-- Note: Direct deletion from storage tables is not allowed via SQL.
-- The empty 'comprovantes' bucket remains but we ensure 'comprovantes-pagamento' is the one used and secured.

-- Ensure 'comprovantes-pagamento' is private and has policies
UPDATE storage.buckets SET public = false WHERE id = 'comprovantes-pagamento';

DROP POLICY IF EXISTS "comprovantes_select_policy" ON storage.objects;
CREATE POLICY "comprovantes_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'comprovantes-pagamento');

DROP POLICY IF EXISTS "comprovantes_insert_policy" ON storage.objects;
CREATE POLICY "comprovantes_insert_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprovantes-pagamento');
