-- Enhance maquinas_operador with client data
DROP VIEW IF EXISTS public.maquinas_operador;
CREATE VIEW public.maquinas_operador 
WITH (security_invoker = true)
AS
SELECT 
  m.id, 
  m.cliente_id, 
  m.codigo_identificacao, 
  m.modelo, 
  m.data_instalacao, 
  (m.status = 'ativa') as ativo, 
  m.created_at,
  c.nome_ponto as cliente_nome,
  c.cidade as cliente_cidade
FROM public.maquinas m
JOIN public.clientes c ON m.cliente_id = c.id
WHERE m.status = 'ativa';

GRANT SELECT ON public.maquinas_operador TO authenticated;
