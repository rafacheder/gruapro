-- Ajustar fn_denormalize_leitura
CREATE OR REPLACE FUNCTION public.fn_denormalize_leitura()
RETURNS TRIGGER AS $$
BEGIN
  SELECT nome_ponto INTO NEW.cliente_nome FROM public.clientes WHERE id = NEW.cliente_id;
  SELECT codigo_identificacao, modelo INTO NEW.maquina_codigo, NEW.maquina_modelo 
  FROM public.maquinas WHERE id = NEW.maquina_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ajustar fn_validate_reading_counters
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
$$ LANGUAGE plpgsql SET search_path = public;

-- Ajustar get_public_machine_v2
CREATE OR REPLACE FUNCTION public.get_public_machine_v2(machine_id uuid)
RETURNS TABLE(codigo_identificacao text, modelo text, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT codigo_identificacao, modelo, status::text
  FROM public.maquinas
  WHERE id = machine_id;
$$;
