-- 1. Rename enum value
ALTER TYPE public.leitura_status RENAME VALUE 'pendente_pagamento' TO 'pendente';

-- Ensure default is 'pendente'
ALTER TABLE public.leituras ALTER COLUMN status SET DEFAULT 'pendente';

-- 2. Create join table
CREATE TABLE public.pagamento_leituras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id uuid NOT NULL REFERENCES public.pagamentos(id) ON DELETE CASCADE,
  leitura_id uuid NOT NULL REFERENCES public.leituras(id) ON DELETE RESTRICT,
  valor_aplicado numeric(10,2) NOT NULL CHECK (valor_aplicado > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(leitura_id) -- uma leitura só pode estar em um pagamento
);

CREATE INDEX idx_pag_leituras_pagamento ON public.pagamento_leituras(pagamento_id);
CREATE INDEX idx_pag_leituras_leitura ON public.pagamento_leituras(leitura_id);

-- 3. Enable RLS
ALTER TABLE public.pagamento_leituras ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for pagamento_leituras
CREATE POLICY "Admin and master can do everything on pagamento_leituras"
  ON public.pagamento_leituras
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- 5. Trigger to update status back to pendente when a pagamento_leitura is deleted
CREATE OR REPLACE FUNCTION public.handle_pagamento_leitura_deleted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leituras 
  SET status = 'pendente' 
  WHERE id = OLD.leitura_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_pagamento_leitura_deleted
AFTER DELETE ON public.pagamento_leituras
FOR EACH ROW
EXECUTE FUNCTION public.handle_pagamento_leitura_deleted();

-- 6. Trigger to log status changes to audit_log
CREATE OR REPLACE FUNCTION public.log_leitura_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (
      usuario_id,
      acao,
      tabela,
      registro_id,
      dados_anteriores,
      dados_novos
    ) VALUES (
      auth.uid(),
      'UPDATE_STATUS',
      'leituras',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_leitura_status_change
AFTER UPDATE ON public.leituras
FOR EACH ROW
EXECUTE FUNCTION public.log_leitura_status_change();
