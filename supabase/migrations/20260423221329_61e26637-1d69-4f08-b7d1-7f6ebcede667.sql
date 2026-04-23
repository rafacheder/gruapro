-- Alterar tabela leituras para incluir contadores
alter table public.leituras
  add column if not exists contador_entrada_atual integer,
  add column if not exists contador_saida_atual integer,
  add column if not exists contador_entrada_anterior integer,
  add column if not exists contador_saida_anterior integer,
  add column if not exists valor_por_credito numeric(10,2);

-- Alterar tabela maquinas para incluir valor por crédito e contadores iniciais
alter table public.maquinas
  add column if not exists valor_por_credito numeric(10,2) default 1.00,
  add column if not exists contador_entrada_inicial integer default 0,
  add column if not exists contador_saida_inicial integer default 0;

-- Atualizar máquinas existentes para ter o valor default se for null
update public.maquinas set valor_por_credito = 1.00 where valor_por_credito is null;
