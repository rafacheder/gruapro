## 1. Tabelas do banco (todas)

#### audit_log
| coluna | tipo | nullable | default | constraint |
| --- | --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() | p |
| usuario_id | uuid | YES | <nil> | f |
| acao | text | NO | <nil> | <nil> |
| tabela | text | NO | <nil> | <nil> |
| registro_id | uuid | YES | <nil> | <nil> |
| dados_antes | jsonb | YES | <nil> | <nil> |
| dados_depois | jsonb | YES | <nil> | <nil> |
| ip_address | text | YES | <nil> | <nil> |
| created_at | timestamp with time zone | NO | now() | <nil> |

#### clientes
| coluna | tipo | nullable | default | constraint |
| --- | --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() | p |
| nome_ponto | text | NO | <nil> | <nil> |
| nome_responsavel | text | NO | <nil> | <nil> |
| telefone_responsavel | text | YES | <nil> | <nil> |
| email | text | YES | <nil> | <nil> |
| cep | text | NO | <nil> | <nil> |
| rua | text | NO | <nil> | <nil> |
| numero | text | NO | <nil> | <nil> |
| complemento | text | YES | <nil> | <nil> |
| bairro | text | NO | <nil> | <nil> |
| cidade | text | NO | <nil> | <nil> |
| estado | text | NO | <nil> | <nil> |
| latitude | numeric | YES | <nil> | <nil> |
| longitude | numeric | YES | <nil> | <nil> |
| percentual_comissao | numeric | NO | <nil> | c |
| data_inicio_contrato | date | YES | <nil> | <nil> |
| observacoes | text | YES | <nil> | <nil> |
| ativo | boolean | NO | true | <nil> |
| created_by | uuid | YES | <nil> | f |
| created_at | timestamp with time zone | NO | now() | <nil> |
| updated_at | timestamp with time zone | NO | now() | <nil> |

#### leitura_fotos
| coluna | tipo | nullable | default | constraint |
| --- | --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() | p |
| leitura_id | uuid | NO | <nil> | f |
| foto_url | text | NO | <nil> | <nil> |
| ordem | integer | NO | 0 | <nil> |
| created_at | timestamp with time zone | NO | now() | <nil> |

#### leituras
| coluna | tipo | nullable | default | constraint |
| --- | --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() | p |
| maquina_id | uuid | NO | <nil> | f |
| cliente_id | uuid | NO | <nil> | f |
| usuario_id | uuid | NO | <nil> | f |
| valor_faturado | numeric | NO | <nil> | <nil> |
| pelucias_saidas | integer | NO | 0 | <nil> |
| valor_comissao | numeric | NO | <nil> | <nil> |
| valor_liquido | numeric | NO | <nil> | <nil> |
| percentual_aplicado | numeric | NO | <nil> | <nil> |
| observacoes | text | YES | <nil> | <nil> |
| data_leitura | timestamp with time zone | NO | now() | <nil> |
| status | text | NO | 'pendente' | <nil> |
| contador_entrada_atual | bigint | YES | <nil> | <nil> |
| contador_saida_atual | bigint | YES | <nil> | <nil> |
| contador_entrada_anterior | bigint | YES | <nil> | <nil> |
| contador_saida_anterior | bigint | YES | <nil> | <nil> |
| valor_por_credito | numeric | YES | <nil> | <nil> |
| created_at | timestamp with time zone | NO | now() | <nil> |

#### maquinas
| coluna | tipo | nullable | default | constraint |
| --- | --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() | p |
| cliente_id | uuid | NO | <nil> | f |
| codigo_identificacao | text | NO | <nil> | u |
| modelo | text | YES | <nil> | <nil> |
| data_instalacao | date | YES | <nil> | <nil> |
| ativo | boolean | NO | true | <nil> |
| created_at | timestamp with time zone | NO | now() | <nil> |
| updated_at | timestamp with time zone | NO | now() | <nil> |
| qr_code_url | text | YES | <nil> | <nil> |
| contador_entrada_inicial | bigint | YES | 0 | <nil> |
| contador_saida_inicial | bigint | YES | 0 | <nil> |
| valor_por_credito | numeric | NO | 2 | <nil> |

#### pagamento_leituras
| coluna | tipo | nullable | default | constraint |
| --- | --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() | p |
| leitura_id | uuid | NO | <nil> | f |
| pagamento_id | uuid | NO | <nil> | f |

#### pagamentos
| coluna | tipo | nullable | default | constraint |
| --- | --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() | p |
| cliente_id | uuid | NO | <nil> | f |
| valor_total | numeric | NO | <nil> | <nil> |
| data_pagamento | timestamp with time zone | NO | now() | <nil> |
| status | text | NO | 'realizado' | <nil> |
| comprovante_url | text | YES | <nil> | <nil> |
| observacoes | text | YES | <nil> | <nil> |
| created_at | timestamp with time zone | NO | now() | <nil> |
| created_by | uuid | YES | <nil> | f |

#### profiles
| coluna | tipo | nullable | default | constraint |
| --- | --- | --- | --- | --- |
| id | uuid | NO | <nil> | p, f |
| updated_at | timestamp with time zone | NO | now() | <nil> |
| username | text | YES | <nil> | u |
| avatar_url | text | YES | <nil> | <nil> |
| nome_completo | text | YES | <nil> | <nil> |

#### user_roles
| coluna | tipo | nullable | default | constraint |
| --- | --- | --- | --- | --- |
| id | uuid | NO | gen_random_uuid() | p |
| user_id | uuid | NO | <nil> | f |
| role | app_role | NO | <nil> | <nil> |

## 2. Views

#### vw_leituras_com_anterior
- security_invoker: true
- Definição SQL completa: 
```sql
SELECT l.id,
    l.maquina_id,
    l.cliente_id,
    l.usuario_id,
    l.valor_faturado,
    l.pelucias_saidas,
    l.valor_comissao,
    l.valor_liquido,
    l.percentual_aplicado,
    l.observacoes,
    l.data_leitura,
    l.status,
    l.contador_entrada_atual,
    l.contador_saida_atual,
    l.contador_entrada_anterior,
    l.contador_saida_anterior,
    l.valor_por_credito,
    l.created_at,
    m.codigo_identificacao AS maquina_codigo,
    c.nome_ponto AS cliente_nome,
    u.nome_completo AS usuario_nome,
    la.data_leitura AS data_leitura_previa
   FROM (((leituras l
     JOIN maquinas m ON ((l.maquina_id = m.id)))
     JOIN clientes c ON ((l.cliente_id = c.id)))
     LEFT JOIN profiles u ON ((l.usuario_id = u.id)))
     LEFT JOIN LATERAL ( SELECT l2.data_leitura
           FROM leituras l2
          WHERE ((l2.maquina_id = l.maquina_id) AND (l2.data_leitura < l.data_leitura))
          ORDER BY l2.data_leitura DESC
         LIMIT 1) la ON (true);
```

#### vw_ultimas_leituras_por_maquina
- security_invoker: true
- Definição SQL completa:
```sql
SELECT DISTINCT ON (l.maquina_id) l.id,
    l.maquina_id,
    l.data_leitura,
    l.contador_entrada_atual,
    l.contador_saida_atual
   FROM leituras l
  ORDER BY l.maquina_id, l.data_leitura DESC;
```

## 3. Functions e Triggers

| nome | tipo (function/trigger) | tabela alvo (se trigger) | retorna | security_definer |
| --- | --- | --- | --- | --- |
| has_role | function | <nil> | boolean | true |
| get_user_role | function | <nil> | app_role | true |
| handle_new_user | function | <nil> | trigger | true |
| prevent_audit_modification | function | <nil> | trigger | true |
| handle_updated_at | function | <nil> | trigger | true |
| handle_pagamento_leitura_deleted | function | <nil> | trigger | true |
| log_leitura_status_change | function | <nil> | trigger | true |
| get_public_machine | function | <nil> | record | true |
| fn_denormalize_leitura | function | <nil> | trigger | true |
| fn_validate_reading_counters | function | <nil> | trigger | false |
| get_public_machine_v2 | function | <nil> | record | true |
| tr_check_filters | trigger | subscription | <nil> | <nil> |
| update_objects_updated_at | trigger | objects | <nil> | <nil> |
| enforce_bucket_name_length_trigger | trigger | buckets | <nil> | <nil> |
| protect_buckets_delete | trigger | buckets | <nil> | <nil> |
| protect_objects_delete | trigger | objects | <nil> | <nil> |
| audit_log_no_update | trigger | audit_log | <nil> | <nil> |
| audit_log_no_delete | trigger | audit_log | <nil> | <nil> |
| set_updated_at_profiles | trigger | profiles | <nil> | <nil> |
| set_updated_at_clientes | trigger | clientes | <nil> | <nil> |
| set_updated_at_maquinas | trigger | maquinas | <nil> | <nil> |
| set_updated_at_leituras | trigger | leituras | <nil> | <nil> |
| on_auth_user_created | trigger | users | <nil> | <nil> |
| on_pagamento_leitura_deleted | trigger | pagamento_leituras | <nil> | <nil> |
| trg_log_leitura_status_change | trigger | leituras | <nil> | <nil> |
| tr_denormalize_leitura | trigger | leituras | <nil> | <nil> |
| tr_validate_reading_counters | trigger | leituras | <nil> | <nil> |

## 4. Políticas RLS (todas, agrupadas por tabela)

#### audit_log
| policy_name | command | roles | using | with_check |
| --- | --- | --- | --- | --- |
| audit_log_insert | INSERT | {authenticated} | <nil> | (usuario_id = auth.uid()) |
| audit_log_select | SELECT | {authenticated} | ((usuario_id = auth.uid()) OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | <nil> |

#### clientes
| policy_name | command | roles | using | with_check |
| --- | --- | --- | --- | --- |
| clientes_insert_role | INSERT | {authenticated} | <nil> | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'usuario'::app_role)) |
| clientes_update_role | UPDATE | {authenticated} | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'usuario'::app_role)) | <nil> |
| clientes_admin_delete | DELETE | {authenticated} | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | <nil> |
| clientes_select_all_auth | SELECT | {authenticated} | true | <nil> |

#### leitura_fotos
| policy_name | command | roles | using | with_check |
| --- | --- | --- | --- | --- |
| leitura_fotos_select | SELECT | {authenticated} | (EXISTS ( SELECT 1 FROM leituras l WHERE ((l.id = leitura_fotos.leitura_id) AND ((l.usuario_id = auth.uid()) OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role))))) | <nil> |
| leitura_fotos_insert | INSERT | {authenticated} | <nil> | (EXISTS ( SELECT 1 FROM leituras l WHERE ((l.id = leitura_fotos.leitura_id) AND (l.usuario_id = auth.uid())))) |
| leitura_fotos_delete | DELETE | {authenticated} | (EXISTS ( SELECT 1 FROM leituras l WHERE ((l.id = leitura_fotos.leitura_id) AND (l.usuario_id = auth.uid())))) | <nil> |

#### leituras
| policy_name | command | roles | using | with_check |
| --- | --- | --- | --- | --- |
| leituras_insert_role | INSERT | {authenticated} | <nil> | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'usuario'::app_role)) |
| leituras_select_role | SELECT | {authenticated} | ((usuario_id = auth.uid()) OR has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | <nil> |
| leituras_update_role | UPDATE | {authenticated} | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR (usuario_id = auth.uid())) | <nil> |
| leituras_delete_admin | DELETE | {authenticated} | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | <nil> |

#### maquinas
| policy_name | command | roles | using | with_check |
| --- | --- | --- | --- | --- |
| maquinas_insert_role | INSERT | {authenticated} | <nil> | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) |
| maquinas_update_role | UPDATE | {authenticated} | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | <nil> |
| maquinas_delete_role | DELETE | {authenticated} | (has_role(auth.uid(), 'master'::app_role)) | <nil> |
| maquinas_select_all_auth | SELECT | {authenticated} | true | <nil> |

#### pagamentos
| policy_name | command | roles | using | with_check |
| --- | --- | --- | --- | --- |
| pagamentos_select_role | SELECT | {authenticated} | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | <nil> |
| pagamentos_insert_role | INSERT | {authenticated} | <nil> | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) |
| pagamentos_update_role | UPDATE | {authenticated} | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | <nil> |
| pagamentos_delete_role | DELETE | {authenticated} | (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | <nil> |

#### profiles
| policy_name | command | roles | using | with_check |
| --- | --- | --- | --- | --- |
| profiles_select_all | SELECT | {authenticated} | true | <nil> |
| profiles_update_own | UPDATE | {authenticated} | (id = auth.uid()) | <nil> |

## 5. Storage Buckets

| bucket | público/privado | políticas |
| --- | --- | --- |
| leitura-fotos | público | leitura_fotos_storage_delete, leitura_fotos_storage_insert, leitura_fotos_storage_read |
| comprovantes | privado | Admin and master can manage payment receipts, Admin and master can view payment receipts, comprovantes_storage_admin |
| comprovantes-pagamento | privado | Admin and master can manage payment receipts, Admin and master can view payment receipts |

## 6. Edge Functions

- Nome: manage-users
- Caminho HTTP: /manage-users
- Auth requerida: sim, role master ou admin
- O que faz: Gerencia a criação de usuários através da Admin Auth API do Supabase.

## 7. Rotas do React Router

| path | componente | proteção (qual role) |
| --- | --- | --- |
| /login | Login | nenhuma |
| /maquina/:id | PublicMachine | nenhuma |
| / | Dashboard | autenticado |
| /clientes | ClientesList | autenticado |
| /clientes/novo | ClienteForm | autenticado |
| /clientes/:id | ClienteDetalhe | autenticado |
| /clientes/:id/editar | ClienteForm | autenticado |
| /maquinas | MaquinasList | autenticado |
| /maquinas/nova | MaquinaForm | autenticado |
| /maquinas/:id | MaquinaDetalhe | autenticado |
| /maquinas/:id/editar | MaquinaForm | autenticado |
| /leituras | LeiturasList | autenticado |
| /leituras/nova | NovaLeitura | autenticado |
| /leituras/:id | LeituraDetalhe | autenticado |
| /leituras/consolidado | RelatorioConsolidado | autenticado |
| /usuarios | UsuariosList | master, admin |
| /pagamentos | PagamentosList | autenticado |
| /pagamentos/:id | PagamentoDetalhe | autenticado |
| /reconciliar | ReconciliacaoView | master |
| /extratos | ExtratosView | master, admin |
| /audit | AuditLog | master |
| * | NotFound | nenhuma |

## 8. Componentes em /src/features

#### features/audit
- AuditLog.tsx — Renderiza o histórico de auditoria do sistema em uma tabela.

#### features/clientes
- ClienteDetalhe.tsx — Renderiza informações detalhadas e estatísticas de um cliente específico.
- ClienteForm.tsx — Renderiza formulário para criação e edição de dados de clientes.
- ClientesList.tsx — Renderiza lista de todos os clientes cadastrados com filtros básicos.

#### features/extratos
- ExtratosView.tsx — Renderiza visão geral financeira agrupada por períodos e clientes.

#### features/leituras
- LeituraDetalhe.tsx — Renderiza dados, cálculos, fotos e opções de exportação da leitura.
- LeiturasList.tsx — Renderiza histórico de leituras realizadas com busca e paginação.
- NovaLeitura.tsx — Renderiza fluxo de captura de dados e fotos para nova leitura.
- RelatorioConsolidado.tsx — Renderiza ferramenta de agrupamento de leituras para fechamento periódico.

#### features/maquinas
- MaquinaDetalhe.tsx — Renderiza detalhes técnicos e histórico de uma máquina específica.
- MaquinaForm.tsx — Renderiza formulário para cadastro e manutenção de máquinas.
- MaquinasList.tsx — Renderiza inventário de máquinas com status e localização atual.

#### features/pagamentos
- PagamentoDetalhe.tsx — Renderiza detalhes de um pagamento efetuado e comprovante.
- PagamentosList.tsx — Renderiza histórico de repasses financeiros realizados aos clientes.
- ReconciliacaoView.tsx — Renderiza interface para vincular leituras pendentes a novos pagamentos.
- RegisterPaymentDialog.tsx — Renderiza modal para registro de novo pagamento no sistema.

#### features/usuarios
- UsuariosList.tsx — Renderiza gerenciamento de acessos e permissões para usuários do sistema.

## 9. Hooks customizados

| nome | parâmetros | retorno | propósito (1 linha) |
| --- | --- | --- | --- |
| use-mobile.tsx | nenhum | boolean | Detecta se o dispositivo do usuário é mobile (largura < 768px). |
| use-online-status.ts | nenhum | boolean | Monitora o estado da conexão de rede do navegador. |
| use-toast.ts | nenhum | Toast helper | Interface para disparar notificações visuais curtas na interface. |

## 10. Utilitários de negócio

#### /src/utils/reading-calculations.ts
- calcularVariacao
- (leituraAtual: any, leituraAnterior: any) => VariacaoLeitura | null
- Calcula variações percentuais e define nível de alerta entre duas leituras.

#### /src/lib/pdf.ts
- gerarPdfConsolidado
- (clienteNome: string, data: string, operadorNome: string, leituras: ConsolidatedLeitura[]) => Promise<void>
- Gera arquivo PDF A4 com resumo de múltiplas leituras para fechamento.
- gerarPdfConsolidadoTermico
- (clienteNome: string, data: string, operadorNome: string, leituras: ConsolidatedLeitura[]) => Promise<void>
- Gera PDF formatado para impressora térmica de 48mm com resumo.
- gerarPdfLeitura
- (l: LeituraPdf, type: 'a4' | 'thermal') => Promise<{ docId, hash }>
- Gera PDF de uma leitura individual em formato A4 ou térmico.

#### /src/lib/format.ts
- formatBRL
- (v: number | null | undefined) => string
- Formata valor numérico como moeda brasileira (R$).
- formatDateTime
- (iso: string | Date) => string
- Formata data e hora no padrão pt-BR (DD/MM/AAAA HH:MM).

#### /src/services/sync-service.ts
- saveOfflineLeitura
- (data: any, fotos: any[]) => Promise<void>
- Armazena localmente uma leitura e fotos para sincronização posterior.
- syncPendingLeituras
- nenhum => Promise<void>
- Envia leituras armazenadas localmente para o banco de dados Supabase.

## 11. Dependências (package.json)

| pacote | versão | uso principal |
| --- | --- | --- |
| @supabase/supabase-js | ^2.104.1 | Cliente para integração com banco de dados e autenticação. |
| @tanstack/react-query | ^5.83.0 | Gerenciamento de estado assíncrono e cache de queries. |
| react-router-dom | ^6.30.1 | Roteamento interno da aplicação SPA. |
| lucide-react | ^0.462.0 | Biblioteca de ícones vetoriais. |
| jspdf | ^4.2.1 | Geração de arquivos PDF no lado do cliente. |
| dexie | ^4.4.2 | Banco de dados local IndexedDB para suporte offline. |
| zod | ^4.3.6 | Validação de esquemas de dados e formulários. |
| recharts | ^2.15.4 | Renderização de gráficos estatísticos. |

## 12. Histórico de migrations

| timestamp | nome do arquivo | resumo do que faz (1 linha) |
| --- | --- | --- |
| 20260423151555 | aacbe54a-f1fe-4408-a192-a715fd228e91 | Criação inicial da estrutura de tabelas e tipos base. |
| 20260423151617 | c57f4cab-59d0-411b-8772-840aeb25c313 | Definição de roles e políticas de segurança RLS iniciais. |
| 20260424193746 | 0f825edc-d65a-45b1-8da9-3f6f6c3c3d6e | Última atualização registrada na estrutura do banco. |

## 13. Bugs conhecidos / TODOs no código

*Nenhum marcador de TODO, FIXME, HACK, BUG ou XXX identificado nos arquivos analisados.*

## 14. Variáveis de ambiente

| nome | obrigatória | descrição |
| --- | --- | --- |
| VITE_SUPABASE_URL | sim | URL do projeto Supabase. |
| VITE_SUPABASE_ANON_KEY | sim | Chave anônima para acesso público ao Supabase. |
| SUPABASE_SERVICE_ROLE_KEY | sim (Edge Function) | Chave de serviço para operações administrativas. |
