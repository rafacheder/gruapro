-- 1. Make bucket public
UPDATE storage.buckets SET public = true WHERE name = 'leitura-fotos';

-- 2. Drop restrictive policies
DROP POLICY IF EXISTS "leitura_fotos_select_role" ON storage.objects;
DROP POLICY IF EXISTS "leitura_fotos_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "leitura_fotos_read_policy" ON storage.objects;

-- 3. Create public read policy
CREATE POLICY "leitura_fotos_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'leitura-fotos');

-- 4. Create authenticated insert policy
CREATE POLICY "leitura_fotos_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'leitura-fotos');
