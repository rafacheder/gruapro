-- Add foreign key from leituras to profiles
ALTER TABLE public.leituras
ADD CONSTRAINT leituras_usuario_id_profiles_fkey
FOREIGN KEY (usuario_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
