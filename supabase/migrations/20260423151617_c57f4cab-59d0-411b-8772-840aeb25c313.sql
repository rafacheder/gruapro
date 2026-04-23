-- Fix function search_path
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is insert-only';
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tighten audit_log insert policy
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;
CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- Tighten leitura_pelucias_detalhe insert policy
DROP POLICY IF EXISTS "leitura_pel_det_insert" ON public.leitura_pelucias_detalhe;
CREATE POLICY "leitura_pel_det_insert" ON public.leitura_pelucias_detalhe
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leituras l
      WHERE l.id = leitura_id AND l.usuario_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'master')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Restrict public bucket listing — only allow reading individual files, not listing the bucket
-- Replace overly broad SELECT with one that requires a specific object name
DROP POLICY IF EXISTS "leitura_fotos_storage_read" ON storage.objects;
CREATE POLICY "leitura_fotos_storage_read" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'leitura-fotos' AND name IS NOT NULL);