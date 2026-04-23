CREATE INDEX IF NOT EXISTS idx_leituras_cliente_data ON public.leituras (cliente_id, data_leitura DESC);
CREATE INDEX IF NOT EXISTS idx_leituras_status ON public.leituras (status);