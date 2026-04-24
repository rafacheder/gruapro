-- 1. Remover views existentes
DROP VIEW IF EXISTS public.vw_leituras_com_anterior CASCADE;
DROP VIEW IF EXISTS public.vw_ultimas_leituras_por_maquina CASCADE;

-- 2. Recriar vw_leituras_com_anterior com security_invoker
CREATE VIEW public.vw_leituras_com_anterior 
WITH (security_invoker=true) AS
WITH ranked_leituras AS (
  SELECT 
    l.id, l.maquina_id, l.cliente_id, l.usuario_id, l.data_leitura,
    l.valor_faturado, l.pelucias_saidas, l.valor_comissao, l.valor_liquido,
    l.percentual_aplicado, l.observacoes, l.status, l.aprovada_por,
    l.offline_synced, l.created_at, l.updated_at,
    l.contador_entrada_atual, l.contador_saida_atual,
    l.contador_entrada_anterior, l.contador_saida_anterior,
    l.valor_por_credito, l.cliente_nome, l.maquina_codigo, l.maquina_modelo,
    lag(l.id) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS leitura_previa_id,
    lag(l.data_leitura) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS data_leitura_previa,
    lag(l.valor_faturado) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS valor_faturado_previo,
    lag(l.pelucias_saidas) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS pelucias_saidas_previa,
    lag(l.contador_entrada_atual) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS contador_entrada_anterior_val,
    lag(l.contador_saida_atual) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS contador_saida_anterior_val,
    lag(l.data_leitura, 2) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS data_leitura_pre_previa,
    row_number() OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura DESC) AS rn_desc
  FROM leituras l
)
SELECT * FROM ranked_leituras;

-- 3. Recriar vw_ultimas_leituras_por_maquina com security_invoker
CREATE VIEW public.vw_ultimas_leituras_por_maquina
WITH (security_invoker=true) AS
SELECT id,
    maquina_id,
    cliente_id,
    usuario_id,
    data_leitura,
    valor_faturado,
    pelucias_saidas,
    valor_comissao,
    valor_liquido,
    percentual_aplicado,
    observacoes,
    status,
    aprovada_por,
    offline_synced,
    created_at,
    updated_at,
    row_number() OVER (PARTITION BY maquina_id ORDER BY data_leitura DESC) AS rn
FROM leituras l;

-- 4. Garantir permissões
GRANT SELECT ON public.vw_leituras_com_anterior TO authenticated;
GRANT SELECT ON public.vw_ultimas_leituras_por_maquina TO authenticated;

-- 5. Limpar policy duplicada
DROP POLICY IF EXISTS leituras_select_restricted ON public.leituras;