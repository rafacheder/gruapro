-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'comprovantes-pagamento', 'comprovantes-pagamento', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'comprovantes-pagamento'
);

-- RLS for storage.objects on this bucket
CREATE POLICY "Admin and master can manage payment receipts"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'comprovantes-pagamento' AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'))
)
WITH CHECK (
  bucket_id = 'comprovantes-pagamento' AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'))
);

-- Policy for SELECT (redundant if using ALL, but good practice)
CREATE POLICY "Admin and master can view payment receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'comprovantes-pagamento' AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'))
);

-- Ensure RLS on pagamentos table matches the requirement
-- We already saw some policies, but let's make sure they are correct.
-- (The existing policies pagamentos_admin and pagamentos_select seem to cover it, but let's be explicit)
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagamentos_admin" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_select" ON public.pagamentos;

CREATE POLICY "Admin and master can do everything on pagamentos"
ON public.pagamentos FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master')
);
