create or replace view public.vw_ultimas_leituras_por_maquina as
select
  l.*,
  row_number() over (partition by l.maquina_id order by l.data_leitura desc) as rn
from public.leituras l;

-- Add comment for Postgrest to pick up types
comment on view public.vw_ultimas_leituras_por_maquina is 'View to get the last two readings per machine for comparative analysis.';
