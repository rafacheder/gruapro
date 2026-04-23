CREATE OR REPLACE FUNCTION public.log_leitura_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (
      usuario_id,
      acao,
      tabela,
      registro_id,
      dados_antes,
      dados_depois
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
$function$;