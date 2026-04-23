create or replace view public.vw_ultimas_leituras_por_maquina 
with (security_invoker = true)
as
select
  l.*,
  row_number() over (partition by l.maquina_id order by l.data_leitura desc) as rn
from public.leituras l;
