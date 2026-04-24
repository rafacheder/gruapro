-- 1. Denormalização na tabela leituras
ALTER TABLE public.leituras 
ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
ADD COLUMN IF NOT EXISTS maquina_codigo TEXT,
ADD COLUMN IF NOT EXISTS maquina_modelo TEXT;

-- 2. Popular dados existentes
UPDATE public.leituras l
SET 
  cliente_nome = c.nome_ponto,
  maquina_codigo = m.codigo_identificacao,
  maquina_modelo = m.modelo
FROM public.clientes c, public.maquinas m
WHERE l.cliente_id = c.id AND l.maquina_id = m.id;

-- 3. Trigger para manter denormalização
CREATE OR REPLACE FUNCTION public.fn_denormalize_leitura()
RETURNS TRIGGER AS $$
BEGIN
  SELECT nome_ponto INTO NEW.cliente_nome FROM public.clientes WHERE id = NEW.cliente_id;
  SELECT codigo_identificacao, modelo INTO NEW.maquina_codigo, NEW.maquina_modelo 
  FROM public.maquinas WHERE id = NEW.maquina_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_denormalize_leitura ON public.leituras;
CREATE TRIGGER tr_denormalize_leitura
BEFORE INSERT OR UPDATE OF cliente_id, maquina_id ON public.leituras
FOR EACH ROW EXECUTE FUNCTION public.fn_denormalize_leitura();

-- 4. Ajustar View maquinas_operador
DROP VIEW IF EXISTS public.maquinas_operador;
CREATE VIEW public.maquinas_operador AS
SELECT 
  id, 
  cliente_id, 
  codigo_identificacao, 
  modelo, 
  data_instalacao, 
  (status = 'ativa') as ativo, 
  created_at, 
  updated_at
FROM public.maquinas
WHERE status = 'ativa';

GRANT SELECT ON public.maquinas_operador TO authenticated;

-- 5. Restringir SELECT direto em maquinas e clientes
DROP POLICY IF EXISTS maquinas_select_all_auth ON public.maquinas;
DROP POLICY IF EXISTS "Allow public read access to machines" ON public.maquinas;
DROP POLICY IF EXISTS "Allow public read access to client info" ON public.clientes;

-- Policy para admin/master ver tudo
DROP POLICY IF EXISTS maquinas_select_admin_master ON public.maquinas;
CREATE POLICY maquinas_select_admin_master ON public.maquinas
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS clientes_select_admin_master ON public.clientes;
CREATE POLICY clientes_select_admin_master ON public.clientes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin'));

-- RPC para permitir acesso público limitado via ID (usado no PublicMachine.tsx)
CREATE OR REPLACE FUNCTION public.get_public_machine_v2(machine_id uuid)
RETURNS TABLE(codigo_identificacao text, modelo text, status text)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT codigo_identificacao, modelo, status::text
  FROM public.maquinas
  WHERE id = machine_id;
$$;

-- 6. Travas de sanidade (Check Constraints)
ALTER TABLE public.leituras DROP CONSTRAINT IF EXISTS check_valor_comissao_positivo;
ALTER TABLE public.leituras ADD CONSTRAINT check_valor_comissao_positivo CHECK (valor_comissao >= 0);

-- Trigger para validar contadores
CREATE OR REPLACE FUNCTION public.fn_validate_reading_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contador_entrada_atual < NEW.contador_entrada_anterior THEN
    RAISE EXCEPTION 'Contador de entrada atual não pode ser menor que o anterior';
  END IF;
  IF NEW.contador_saida_atual < NEW.contador_saida_anterior THEN
    RAISE EXCEPTION 'Contador de saída atual não pode ser menor que o anterior';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_validate_reading_counters ON public.leituras;
CREATE TRIGGER tr_validate_reading_counters
BEFORE INSERT OR UPDATE ON public.leituras
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_reading_counters();

-- 7. Limpeza (Cleanup)
DROP TABLE IF EXISTS public.pelucias_tipos CASCADE;
DROP TABLE IF EXISTS public.maquina_estoque CASCADE;
DROP TABLE IF EXISTS public.reposicoes CASCADE;
DROP TABLE IF EXISTS public.leitura_pelucias_detalhe CASCADE;

-- Atualizar view que pode depender da coluna removida
ALTER TABLE public.leituras DROP COLUMN IF EXISTS assinatura_base64;
