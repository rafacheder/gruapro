DROP VIEW IF EXISTS public.maquinas_operador CASCADE;

CREATE OR REPLACE VIEW public.maquinas_operador AS
SELECT 
  m.id, 
  m.cliente_id, 
  m.codigo_identificacao, 
  m.modelo, 
  m.data_instalacao, 
  m.status, 
  m.qr_code_url,
  m.created_at
FROM public.maquinas m
WHERE m.status = 'ativa';

GRANT SELECT ON public.maquinas_operador TO authenticated;