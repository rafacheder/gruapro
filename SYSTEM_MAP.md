 # Mapa do Sistema - Gestão de Máquinas e Leituras
 
 ## 🎯 Objetivo do Sistema
 Sistema de gestão para operação de máquinas (ex: vending machines, música, etc.), permitindo o controle de clientes, máquinas, leituras periódicas, faturamento e pagamentos. Possui suporte offline via PWA e sincronização com Supabase.
 
 ## 🏗️ Arquitetura Técnica
 - **Frontend:** React + TypeScript + Vite + Tailwind CSS
 - **Backend/Database:** Supabase (PostgreSQL + Auth + Edge Functions)
 - **Estado & Dados:** TanStack Query + Context API (Auth) + Dexie (IndexedDB para Offline)
 - **Relatórios:** jsPDF + jspdf-autotable (A4 e Térmico 57mm)
 - **Segurança:** RLS (Row Level Security) no Supabase + Rotas Protegidas no Frontend
 
 ## 📂 Estrutura de Pastas e Componentes Chave
 
 ### `/src/features` (Módulos de Negócio)
 - **`leituras/`**: Core do sistema. Lógica de entrada de dados, cálculos de faturamento e geração de relatórios (A4/57mm).
   - `LeiturasList.tsx`: Visualização e filtros de leituras.
   - `NovaLeitura.tsx`: Fluxo de inserção de dados.
   - `RelatorioConsolidado.tsx`: Visão agrupada de leituras.
 - **`clientes/`**: Cadastro e gestão de pontos de venda/parceiros.
 - **`maquinas/`**: Inventário técnico das máquinas e QR Codes para acesso público.
 - **`pagamentos/`**: Controle de repasses aos clientes e status financeiro.
 - **`extratos/`**: Visão financeira consolidada (exclusivo Admin/Master).
 - **`usuarios/`**: Gestão de acessos (Master/Admin/Usuario).
 - **`audit/`**: Logs de atividades críticas do sistema.
 
 ### `/src/lib` & `/src/services` (Utilitários)
 - `db.ts`: Configuração do Dexie para armazenamento local e persistência offline.
 - `sync-service.ts`: Lógica de sincronização entre IndexedDB e Supabase.
 - `pdf.ts`: Configurações globais e helpers para geração de PDFs.
 - `format.ts`: Helpers de formatação (Moeda, Datas, etc.).
 
 ## 🔐 Níveis de Acesso (Roles)
 1. **Master:** Acesso total, incluindo auditoria e reconciliação financeira.
 2. **Admin:** Gestão de clientes, máquinas e leituras. Acesso a extratos.
 3. **Usuario (Operador):** Focado em realizar leituras em campo. Recentemente habilitado para gerar relatórios de leitura.
 
 ## 🔄 Fluxo de Dados Crítico
 1. **Leitura:** Operador insere contadores (Entrada/Saída/Refill) -> Salva localmente (Dexie) -> Sync Service tenta subir para Supabase.
 2. **Cálculo:** `utils/reading-calculations.ts` define a lógica de lucro e comissões.
 3. **Pagamento:** Admin/Master confirma recebimento e gera registro de pagamento.
 
 ## 📡 Integrações
 - **Supabase:** Auth, Database, Storage, Edge Functions.
 - **ViaCEP:** Autocomplete de endereços no cadastro de clientes.
 - **Vite PWA:** Service Worker para funcionamento sem internet.