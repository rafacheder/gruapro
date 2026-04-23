DROP VIEW IF EXISTS public.vw_leituras_com_anterior;

CREATE OR REPLACE VIEW public.vw_leituras_com_anterior 
WITH (security_invoker = true)
AS
 WITH ranked_leituras AS (
         SELECT l.*,
            lag(l.id) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS leitura_previa_id,
            lag(l.data_leitura) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS data_leitura_previa,
            lag(l.valor_faturado) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS valor_faturado_previo,
            lag(l.pelucias_saidas) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS pelucias_saidas_previa,
            lag(l.contador_entrada_atual) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS contador_entrada_anterior_val,
            lag(l.contador_saida_atual) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS contador_saida_anterior_val,
            lag(l.data_leitura, 2) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS data_leitura_pre_previa,
            row_number() OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura DESC) AS rn_desc
           FROM leituras l
        )
 SELECT * FROM ranked_leituras;
