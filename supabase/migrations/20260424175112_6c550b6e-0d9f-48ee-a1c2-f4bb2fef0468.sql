-- 1. Dropar views dependentes para permitir alteração de colunas
DROP VIEW IF EXISTS public.vw_ultimas_leituras_por_maquina;
DROP VIEW IF EXISTS public.vw_leituras_com_anterior;

-- 2. Limpeza de Schema Órfão
DROP TABLE IF EXISTS public.leitura_pelucias_detalhe;
DROP TABLE IF EXISTS public.reposicoes;
DROP TABLE IF EXISTS public.maquina_estoque;
DROP TABLE IF EXISTS public.pelucias_tipos;

ALTER TABLE public.leituras DROP COLUMN IF EXISTS assinatura_base64;

-- 3. Recriar views sem a coluna removida
CREATE OR REPLACE VIEW public.vw_ultimas_leituras_por_maquina AS
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

CREATE OR REPLACE VIEW public.vw_leituras_com_anterior AS
 WITH ranked_leituras AS (
         SELECT l.id,
            l.maquina_id,
            l.cliente_id,
            l.usuario_id,
            l.data_leitura,
            l.valor_faturado,
            l.pelucias_saidas,
            l.valor_comissao,
            l.valor_liquido,
            l.percentual_aplicado,
            l.observacoes,
            l.status,
            l.aprovada_por,
            l.offline_synced,
            l.created_at,
            l.updated_at,
            l.contador_entrada_atual,
            l.contador_saida_atual,
            l.contador_entrada_anterior,
            l.contador_saida_anterior,
            l.valor_por_credito,
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
    contador_entrada_atual,
    contador_saida_atual,
    contador_entrada_anterior,
    contador_saida_anterior,
    valor_por_credito,
    leitura_previa_id,
    data_leitura_previa,
    valor_faturado_previo,
    pelucias_saidas_previa,
    contador_entrada_anterior_val,
    contador_saida_anterior_val,
    data_leitura_pre_previa,
    rn_desc
   FROM ranked_leituras;

-- 4. CHECK Constraints em leituras
ALTER TABLE public.leituras
  ADD CONSTRAINT leituras_valor_comissao_nao_negativo 
    CHECK (valor_comissao >= 0),
  ADD CONSTRAINT leituras_valor_liquido_nao_negativo 
    CHECK (valor_liquido >= 0),
  ADD CONSTRAINT leituras_percentual_aplicado_valido 
    CHECK (percentual_aplicado >= 0 AND percentual_aplicado <= 100),
  ADD CONSTRAINT leituras_status_valido 
    CHECK (status IN ('pendente','pago','cancelado')),
  ADD CONSTRAINT leituras_contador_entrada_ordem 
    CHECK (
      contador_entrada_anterior IS NULL 
      OR contador_entrada_atual IS NULL 
      OR contador_entrada_atual >= contador_entrada_anterior
    ),
  ADD CONSTRAINT leituras_contador_saida_ordem 
    CHECK (
      contador_saida_anterior IS NULL 
      OR contador_saida_atual IS NULL 
      OR contador_saida_atual >= contador_saida_anterior
    );

-- 5. Views Filtradas e Políticas RLS

-- Clientes
CREATE OR REPLACE VIEW public.clientes_operador AS
SELECT 
  id, nome_ponto, nome_responsavel, telefone_responsavel,
  cep, rua, numero, complemento, bairro, cidade, estado,
  ativo, created_at
FROM public.clientes
WHERE ativo = true;

GRANT SELECT ON public.clientes_operador TO authenticated;

DROP POLICY IF EXISTS clientes_select_all_auth ON public.clientes;

CREATE POLICY clientes_select_admin_master ON public.clientes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin'));

-- Maquinas
CREATE OR REPLACE VIEW public.maquinas_operador AS
SELECT 
  id, cliente_id, codigo_identificacao, modelo, data_instalacao, 
  status as ativo, created_at, updated_at
FROM public.maquinas
WHERE status = 'ativa';

GRANT SELECT ON public.maquinas_operador TO authenticated;

DROP POLICY IF EXISTS maquinas_select_all_auth ON public.maquinas;

CREATE POLICY maquinas_select_admin_master ON public.maquinas
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin'));

-- 6. Função RPC para consulta pública de máquinas
CREATE OR REPLACE FUNCTION public.get_public_machine(machine_id uuid)
RETURNS TABLE(codigo_identificacao text, modelo text, ativo boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT codigo_identificacao, modelo, (status = 'ativa') as ativo
  FROM public.maquinas
  WHERE id = machine_id AND status = 'ativa';
$$;

GRANT EXECUTE ON FUNCTION public.get_public_machine(uuid) TO anon, authenticated;
