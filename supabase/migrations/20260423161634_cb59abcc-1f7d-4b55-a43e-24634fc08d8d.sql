drop view if exists public.vw_leituras_com_anterior;

create view public.vw_leituras_com_anterior 
with (security_invoker = true)
as
with ranked_leituras as (
  select
    l.*,
    lag(l.id) over (partition by l.maquina_id order by l.data_leitura asc) as leitura_previa_id,
    lag(l.data_leitura) over (partition by l.maquina_id order by l.data_leitura asc) as data_leitura_previa,
    lag(l.valor_faturado) over (partition by l.maquina_id order by l.data_leitura asc) as valor_faturado_previo,
    lag(l.pelucias_saidas) over (partition by l.maquina_id order by l.data_leitura asc) as pelucias_saidas_previa,
    lag(l.data_leitura, 2) over (partition by l.maquina_id order by l.data_leitura asc) as data_leitura_pre_previa,
    row_number() over (partition by l.maquina_id order by l.data_leitura desc) as rn_desc
  from public.leituras l
)
select * from ranked_leituras;
