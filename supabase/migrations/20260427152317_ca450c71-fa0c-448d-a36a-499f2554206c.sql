-- B2. Adicionar CHECK constraint de valor na tabela pagamentos
ALTER TABLE public.pagamentos
  ADD CONSTRAINT pagamentos_valor_positivo 
    CHECK (valor > 0);
