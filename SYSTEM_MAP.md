 # Mapa do Sistema - Factual
 
 ## 1. Tabelas do Banco (public)
 
 ### audit_log
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | usuario_id | uuid | YES | NULL | FOREIGN KEY auth.users |
 | acao | text | NO | NULL | - |
 | tabela | text | NO | NULL | - |
 | registro_id | uuid | YES | NULL | - |
 | dados_antes | jsonb | YES | NULL | - |
 | dados_depois | jsonb | YES | NULL | - |
 | ip_address | text | YES | NULL | - |
 | created_at | timestamptz | NO | now() | - |
 
 ### clientes
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | nome_ponto | text | NO | NULL | - |
 | nome_responsavel | text | NO | NULL | - |
 | telefone_responsavel | text | NO | NULL | - |
 | email | text | YES | NULL | - |
 | cep | text | NO | NULL | - |
 | rua | text | NO | NULL | - |
 | numero | text | NO | NULL | - |
 | complemento | text | YES | NULL | - |
 | bairro | text | NO | NULL | - |
 | cidade | text | NO | NULL | - |
 | estado | text | NO | NULL | - |
 | latitude | numeric | YES | NULL | - |
 | longitude | numeric | YES | NULL | - |
 | percentual_comissao | numeric | NO | NULL | CHECK (>= 0 AND <= 100) |
 | data_inicio_contrato | date | YES | NULL | - |
 | observacoes | text | YES | NULL | - |
 | ativo | boolean | NO | true | - |
 | created_by | uuid | YES | NULL | FOREIGN KEY auth.users |
 | created_at | timestamptz | NO | now() | - |
 | updated_at | timestamptz | NO | now() | - |
 
 ### leituras
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | maquina_id | uuid | NO | NULL | FOREIGN KEY maquinas |
 | cliente_id | uuid | NO | NULL | FOREIGN KEY clientes |
 | usuario_id | uuid | NO | NULL | FOREIGN KEY auth.users |
 | data_leitura | timestamptz | NO | now() | - |
 | valor_faturado | numeric | NO | NULL | CHECK (>= 0) |
 | pelucias_saidas | integer | NO | 0 | CHECK (>= 0) |
 | valor_comissao | numeric | NO | NULL | - |
 | valor_liquido | numeric | NO | NULL | - |
 | percentual_aplicado | numeric | NO | NULL | - |
 | assinatura_base64 | text | YES | NULL | - |
 | observacoes | text | YES | NULL | - |
 | status | text | NO | 'pendente' | - |
 | aprovada_por | uuid | YES | NULL | FOREIGN KEY auth.users |
 | offline_synced | boolean | NO | false | - |
 | created_at | timestamptz | NO | now() | - |
 | updated_at | timestamptz | NO | now() | - |
 | contador_entrada_atual | integer | YES | NULL | - |
 | contador_saida_atual | integer | YES | NULL | - |
 | contador_entrada_anterior | integer | YES | NULL | - |
 | contador_saida_anterior | integer | YES | NULL | - |
 | valor_por_credito | numeric | YES | NULL | - |
 
 ### maquinas
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | cliente_id | uuid | NO | NULL | FOREIGN KEY clientes |
 | codigo_identificacao | text | NO | NULL | UNIQUE |
 | modelo | text | YES | NULL | - |
 | numero_serie | text | YES | NULL | - |
 | data_instalacao | date | YES | NULL | - |
 | ativo | boolean | NO | true | - |
 | created_at | timestamptz | NO | now() | - |
 | updated_at | timestamptz | NO | now() | - |
 
 ### user_roles
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | user_id | uuid | NO | NULL | FOREIGN KEY auth.users, UNIQUE(user_id, role) |
 | role | app_role | NO | NULL | - |
 
 ### profiles
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | NULL | PRIMARY KEY, FOREIGN KEY auth.users |
 | nome_completo | text | YES | NULL | - |
 | avatar_url | text | YES | NULL | - |
 | updated_at | timestamptz | YES | NULL | - |
 
 ### leitura_fotos
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | leitura_id | uuid | NO | NULL | FOREIGN KEY leituras |
 | foto_url | text | NO | NULL | - |
 | ordem | integer | NO | NULL | CHECK (>= 1 AND <= 5) |
 | created_at | timestamptz | NO | now() | - |
 
 ### pelucias_tipos
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | nome | text | NO | NULL | - |
 | preco_custo | numeric | YES | NULL | - |
 | ativo | boolean | NO | true | - |
 | created_at | timestamptz | NO | now() | - |
 
 ### maquina_estoque
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | maquina_id | uuid | NO | NULL | FOREIGN KEY maquinas |
 | pelucia_tipo_id | uuid | NO | NULL | FOREIGN KEY pelucias_tipos |
 | quantidade | integer | NO | 0 | - |
 | updated_at | timestamptz | NO | now() | - |
 
 ### reposicoes
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | maquina_id | uuid | NO | NULL | FOREIGN KEY maquinas |
 | pelucia_tipo_id | uuid | NO | NULL | FOREIGN KEY pelucias_tipos |
 | quantidade | integer | NO | NULL | CHECK (> 0) |
 | usuario_id | uuid | NO | NULL | FOREIGN KEY auth.users |
 | data_reposicao | timestamptz | NO | now() | - |
 
 ### leitura_pelucias_detalhe
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | leitura_id | uuid | NO | NULL | FOREIGN KEY leituras |
 | pelucia_tipo_id | uuid | NO | NULL | FOREIGN KEY pelucias_tipos |
 | quantidade | integer | NO | NULL | CHECK (>= 0) |
 
 ### pagamentos
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | cliente_id | uuid | NO | NULL | FOREIGN KEY clientes |
 | valor_total | numeric | NO | NULL | - |
 | data_pagamento | date | NO | NULL | - |
 | comprovante_url | text | YES | NULL | - |
 | observacoes | text | YES | NULL | - |
 | criado_por | uuid | NO | NULL | FOREIGN KEY auth.users |
 | created_at | timestamptz | NO | now() | - |
 
 ### pagamento_leituras
 | coluna | tipo | nullable | default | constraint |
 |---|---|---|---|---|
 | id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
 | pagamento_id | uuid | NO | NULL | FOREIGN KEY pagamentos |
 | leitura_id | uuid | NO | NULL | FOREIGN KEY leituras |
 
 ## 2. Views
 
 ### vw_ultimas_leituras_por_maquina
 ```sql
 SELECT id, maquina_id, cliente_id, usuario_id, data_leitura, valor_faturado, pelucias_saidas, valor_comissao, valor_liquido, percentual_aplicado, assinatura_base64, observacoes, status, aprovada_por, offline_synced, created_at, updated_at, row_number() OVER (PARTITION BY maquina_id ORDER BY data_leitura DESC) AS rn FROM leituras l;
 ```
 
 ### vw_leituras_com_anterior
 ```sql
 WITH ranked_leituras AS ( SELECT l.id, l.maquina_id, l.cliente_id, l.usuario_id, l.data_leitura, l.valor_faturado, l.pelucias_saidas, l.valor_comissao, l.valor_liquido, l.percentual_aplicado, l.assinatura_base64, l.observacoes, l.status, l.aprovada_por, l.offline_synced, l.created_at, l.updated_at, l.contador_entrada_atual, l.contador_saida_atual, l.contador_entrada_anterior, l.contador_saida_anterior, l.valor_por_credito, lag(l.id) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS leitura_previa_id, lag(l.data_leitura) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS data_leitura_previa, lag(l.valor_faturado) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS valor_faturado_previo, lag(l.pelucias_saidas) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS pelucias_saidas_previa, lag(l.contador_entrada_atual) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS contador_entrada_anterior_val, lag(l.contador_saida_atual) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS contador_saida_anterior_val, lag(l.data_leitura, 2) OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura) AS data_leitura_pre_previa, row_number() OVER (PARTITION BY l.maquina_id ORDER BY l.data_leitura DESC) AS rn_desc FROM leituras l ) SELECT * FROM ranked_leituras;
 ```
 
 ## 3. Functions e Triggers
 
 | Function Name | Arguments | Return Type | Security Definer |
 |---|---|---|---|
 | has_role | _user_id uuid, _role app_role | boolean | true |
 | get_user_role | _user_id uuid | app_role | true |
 | handle_new_user | - | trigger | true |
 | prevent_audit_modification | - | trigger | true |
 | handle_updated_at | - | trigger | true |
 | log_leitura_status_change | - | trigger | true |
 | handle_pagamento_leitura_deleted | - | trigger | true |
 
 | Trigger Name | Table | Timing | Event | Function Called |
 |---|---|---|---|---|
 | audit_log_no_update | audit_log | BEFORE | UPDATE | prevent_audit_modification |
 | audit_log_no_delete | audit_log | BEFORE | DELETE | prevent_audit_modification |
 | set_updated_at_profiles | profiles | BEFORE | UPDATE | handle_updated_at |
 | set_updated_at_clientes | clientes | BEFORE | UPDATE | handle_updated_at |
 | set_updated_at_maquinas | maquinas | BEFORE | UPDATE | handle_updated_at |
 | set_updated_at_leituras | leituras | BEFORE | UPDATE | handle_updated_at |
 | on_pagamento_leitura_deleted | pagamento_leituras | AFTER | DELETE | handle_pagamento_leitura_deleted |
 | trg_log_leitura_status_change | leituras | AFTER | UPDATE | log_leitura_status_change |
 
 ## 4. Políticas RLS
 
 | tabela | policy name | command | role | using | with check |
 |---|---|---|---|---|---|
 | profiles | profiles_select_all | SELECT | authenticated | true | - |
 | profiles | profiles_update_own | UPDATE | authenticated | (auth.uid() = id) | - |
 | profiles | profiles_admin_update | UPDATE | authenticated | (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin')) | - |
 | user_roles | user_roles_select_own | SELECT | authenticated | ((user_id = auth.uid()) OR has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin')) | - |
 | user_roles | user_roles_master_all | ALL | authenticated | has_role(auth.uid(), 'master') | has_role(auth.uid(), 'master') |
 | user_roles | user_roles_admin_manage_user | INSERT | authenticated | - | (has_role(auth.uid(), 'admin') AND (role = 'usuario')) |
 | user_roles | user_roles_admin_delete_user | DELETE | authenticated | (has_role(auth.uid(), 'admin') AND (role = 'usuario')) | - |
 | clientes | clientes_select_all_auth | SELECT | authenticated | true | - |
 | clientes | clientes_admin_insert | INSERT | authenticated | - | (has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin')) |
 | maquinas | maquinas_select_all_auth | SELECT | authenticated | true | - |
 | leituras | leituras_select | SELECT | authenticated | ((usuario_id = auth.uid()) OR has_role(auth.uid(), 'master') OR has_role(auth.uid(), 'admin')) | - |
 | leituras | leituras_insert | INSERT | authenticated | - | (usuario_id = auth.uid()) |
 | leitura_fotos | leitura_fotos_select | SELECT | authenticated | (EXISTS (SELECT 1 FROM leituras WHERE id = leitura_fotos.leitura_id AND ...)) | - |
 
 ## 5. Storage Buckets
 
 | name | public | access policies |
 |---|---|---|
 | leitura-fotos | true | SELECT (authenticated), INSERT (authenticated), DELETE (admin/master) |
 | comprovantes | false | SELECT (admin/master), INSERT (admin/master) |
 | comprovantes-pagamento | false | SELECT (admin/master), INSERT (admin/master) |
 
 ## 6. Edge Functions
 
 | Nome | Método | Auth | O que faz |
 |---|---|---|---|
 | manage-users | POST | master/admin | Cria usuários no auth.users via admin API. |
 
 ## 7. Rotas do React Router
 
 | path | componente | proteção |
 |---|---|---|
 | /login | Login | - |
 | /maquina/:id | PublicMachine | - |
 | / | Dashboard | Shell (authenticated) |
 | /clientes | ClientesList | Shell (authenticated) |
 | /clientes/novo | ClienteForm | Shell (authenticated) |
 | /clientes/:id | ClienteDetalhe | Shell (authenticated) |
 | /maquinas | MaquinasList | Shell (authenticated) |
 | /maquinas/nova | MaquinaForm | Shell (authenticated) |
 | /maquinas/:id | MaquinaDetalhe | Shell (authenticated) |
 | /leituras | LeiturasList | Shell (authenticated) |
 | /leituras/nova | NovaLeitura | Shell (authenticated) |
 | /leituras/:id | LeituraDetalhe | Shell (authenticated) |
 | /leituras/consolidado | RelatorioConsolidado | Shell (authenticated) |
 | /usuarios | UsuariosList | ProtectedRoute(master, admin) |
 | /pagamentos | PagamentosList | ProtectedRoute(master, admin) |
 | /reconciliar | ReconciliacaoView | ProtectedRoute(master) |
 | /extratos | ExtratosView | ProtectedRoute(master, admin) |
 | /audit | AuditLog | ProtectedRoute(master) |
 
 ## 8. Componentes em /src/features
 
 ### audit
 - `AuditLog.tsx`: Renderiza tabela de logs de auditoria do sistema.
 ### clientes
 - `ClienteDetalhe.tsx`: Renderiza detalhes, máquinas e histórico de um cliente.
 - `ClienteForm.tsx`: Renderiza formulário de criação e edição de clientes.
 - `ClientesList.tsx`: Renderiza lista filtrável de clientes cadastrados.
 - `ClienteCard.tsx`: Renderiza card com resumo de informações do cliente.
 ### dashboard
 - `AlertsList.tsx`: Renderiza lista de alertas de queda de faturamento.
 - `PeriodFilter.tsx`: Renderiza seletores de período para filtragem de dados.
 - `StatCard.tsx`: Renderiza card com métricas (faturamento, leituras, etc).
 ### extratos
 - `ExtratosView.tsx`: Renderiza visão financeira consolidada por cliente/período.
 ### leituras
 - `LeituraDetalhe.tsx`: Renderiza detalhes, fotos e ações de uma leitura.
 - `LeiturasList.tsx`: Renderiza lista de leituras com filtros e exportação.
 - `NovaLeitura.tsx`: Renderiza fluxo de inserção de dados de leitura.
 - `RelatorioConsolidado.tsx`: Renderiza visualização para geração de relatórios agrupados.
 - `MachineSelector.tsx`: Renderiza componente para seleção de máquina na leitura.
 - `ReadingCalculationsPanel.tsx`: Renderiza painel com cálculos automáticos de faturamento.
 - `ReadingFilters.tsx`: Renderiza filtros de busca para lista de leituras.
 - `ReadingFormFields.tsx`: Renderiza campos de formulário para inserção de contadores.
 - `ReadingPhotoUpload.tsx`: Renderiza interface para upload de fotos da leitura.
 - `ReadingSummary.tsx`: Renderiza resumo final dos valores calculados.
 ### maquinas
 - `MaquinaDetalhe.tsx`: Renderiza informações técnicas e QR Code da máquina.
 - `MaquinaForm.tsx`: Renderiza formulário de cadastro e edição de máquinas.
 - `MaquinasList.tsx`: Renderiza lista de máquinas por cliente e status.
 ### pagamentos
 - `PagamentoDetalhe.tsx`: Renderiza detalhes de um repasse e leituras vinculadas.
 - `PagamentosList.tsx`: Renderiza histórico de pagamentos realizados aos clientes.
 - `ReconciliacaoView.tsx`: Renderiza interface para conferência manual de faturamentos.
 - `RegisterPaymentDialog.tsx`: Renderiza modal para registro de novos pagamentos.
 ### usuarios
 - `UsuariosList.tsx`: Renderiza gestão de usuários e atribuição de roles.
 
 ## 9. Hooks customizados
 
 | Nome | Assinatura | O que faz |
 |---|---|---|
 | use-mobile | `() => boolean` | Retorna se o dispositivo é mobile (< 768px). |
 | use-online-status | `() => boolean` | Retorna o status de conectividade do navegador. |
 | use-toast | `() => { toast, ... }` | Hook para disparo de notificações via sonner/toast. |
 | useClientes | `() => { clientes, isLoading }` | Gerencia busca e estado da lista de clientes. |
 | useDashboardStats | `(period) => stats` | Calcula métricas agregadas para o painel principal. |
 | useLeituraForm | `(maquinaId) => { ... }` | Gerencia lógica e estado do formulário de leitura. |
 
 ## 10. Utilitários de negócio
 
 ### reading-calculations.ts
 - `calcularVariacao`: `(atual, anterior) => VariacaoLeitura` | Calcula percentual de variação e define nível de alerta.
 
 ### pdf.ts
 - `gerarPdfConsolidado`: `(cliente, data, operador, leituras) => void` | Gera PDF A4 com resumo de múltiplas leituras.
 - `gerarPdfConsolidadoTermico`: `(cliente, data, operador, leituras) => void` | Gera PDF em formato bobina 48mm.
 - `gerarPdfLeitura`: `(leitura, type) => { docId, hash }` | Gera PDF individual de leitura (A4 ou Térmico).
 
 ### format.ts
 - `formatBRL`: `(number) => string` | Formata número para moeda Real (R$).
 - `formatNumber`: `(number) => string` | Formata número para padrão decimal brasileiro.
 - `formatDateTime`: `(string/Date) => string` | Formata ISO para data e hora brasileira.
 - `calcComissao`: `(faturamento, percentual) => { comissao, liquido }` | Calcula valores de repasse e saldo.
 
 ## 11. Integrações Externas
 
 | Serviço | Local de Chamada | Finalidade |
 |---|---|---|
 | ViaCEP | `src/lib/viacep.ts` | Autocompletar endereço pelo CEP. |
 | Supabase Auth | `src/contexts/AuthContext.tsx` | Autenticação e gestão de sessão. |
 | Supabase Storage | `src/features/leituras/components/ReadingPhotoUpload.tsx` | Armazenamento de imagens de auditoria. |
 
 ## 12. Dependências Relevantes
 
 | Pacote | Versão |
 |---|---|
 | react | 18.3.1 |
 | @supabase/supabase-js | 2.104.1 |
 | dexie | 4.4.2 |
 | jspdf | 4.2.1 |
 | date-fns | 4.1.0 |
 | react-router-dom | 6.30.1 |
 | tailwindcss | 3.4.17 |
 | zod | 4.3.6 |