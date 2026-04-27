-- 1. Bucket leitura-fotos
UPDATE storage.buckets SET public = false WHERE name = 'leitura-fotos';

DROP POLICY IF EXISTS "leitura_fotos_select_role" ON storage.objects;
DROP POLICY IF EXISTS "leitura_fotos_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "leitura_fotos_authenticated_select" ON storage.objects;

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

-- 4. Constraints
-- Table pagamentos: valor column
ALTER TABLE public.pagamentos DROP CONSTRAINT IF EXISTS pagamentos_valor_positivo;
ALTER TABLE public.pagamentos ADD CONSTRAINT pagamentos_valor_positivo CHECK (valor > 0);

-- Table leituras: status
ALTER TABLE public.leituras DROP CONSTRAINT IF EXISTS leituras_status_valido;
ALTER TABLE public.leituras ADD CONSTRAINT leituras_status_valido 
CHECK (status = ANY (ARRAY['pendente'::leitura_status, 'pago'::leitura_status, 'cancelado'::leitura_status]));
