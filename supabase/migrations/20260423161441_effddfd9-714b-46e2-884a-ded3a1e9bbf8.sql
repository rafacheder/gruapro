create or replace view public.vw_leituras_com_anterior 
with (security_invoker = true)
as
with ranked_leituras as (
  select
    l.*,
    lag(l.data_leitura) over (partition by l.maquina_id order by l.data_leitura asc) as data_leitura_previa,
    lag(l.valor_faturado) over (partition by l.maquina_id order by l.data_leitura asc) as valor_faturado_previo,
    lag(l.pelucias_saidas) over (partition by l.maquina_id order by l.data_leitura asc) as pelucias_saidas_previa,
    -- Também precisamos do intervalo da leitura anterior para calcular o faturamento diário dela
    lag(l.data_leitura, 2) over (partition by l.maquina_id order by l.data_leitura asc) as data_leitura_pre_previa
  from public.leituras l
)
select * from ranked_leituras;

comment on view public.vw_leituras_com_anterior is 'View that joins each reading with its predecessor data for comparative analysis.';
