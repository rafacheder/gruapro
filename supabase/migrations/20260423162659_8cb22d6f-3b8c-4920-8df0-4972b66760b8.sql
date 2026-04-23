ALTER TABLE public.pagamentos 
  DROP CONSTRAINT IF EXISTS pagamentos_registrado_por_fkey,
  ADD CONSTRAINT pagamentos_registrado_por_profiles_fkey 
  FOREIGN KEY (registrado_por) REFERENCES public.profiles(id);
