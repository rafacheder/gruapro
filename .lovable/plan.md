

## Corrigir menu que não está aparecendo

### Causa raiz

Dois problemas combinados:

**1. Código quebrado em `AppShell.tsx`**
As linhas 67–72 contêm um bloco JSX órfão (um `<div>` solto com `SyncStatusBadge` e botão `+`) entre a função `handleLogout` e o `return`. Sobra de patch anterior — código inválido que pode quebrar a renderização.

**2. Usuário sem perfil nem role após o TRUNCATE**
Você apagou todos os registros do banco, incluindo as tabelas `profiles` e `user_roles`. Os logs de autenticação confirmam que você (rafatcheder@gmail.com, `user_id 8f446950-...`) está logado normalmente, mas:
- Não existe linha em `profiles` para esse user → `nome` vem vazio
- Não existe linha em `user_roles` para esse user → `role` é `null`
- O filtro `navItems.filter((i) => role && ...)` retorna array vazio
- Resultado: nenhum item de menu é renderizado, nem na sidebar desktop nem no bottom nav mobile

### O que vou fazer

**Passo 1 — Limpar `src/components/AppShell.tsx`**
Remover o bloco JSX órfão (linhas 67–72) que está fora de qualquer função. O resto do layout (sidebar desktop com `hidden md:flex`, header mobile, bottom nav mobile) fica como estava antes.

**Passo 2 — Recriar seu perfil e role master no banco**
Inserir, para o `auth.uid` `8f446950-ecd2-4ce6-8617-4c131a033746` (rafatcheder@gmail.com):
- Linha em `public.profiles` com `nome_completo = 'Rafael'` e seu email
- Linha em `public.user_roles` com `role = 'master'`

Isso é exatamente o que o trigger `handle_new_user` faria automaticamente em um signup novo desse email — só estou refazendo manualmente porque o usuário no `auth.users` continuou existindo (o TRUNCATE não toca em `auth.*`), mas as linhas dependentes em `public.*` foram removidas.

**Passo 3 — Recarregar a página**
Após recriar profile + role, o `AuthContext` vai buscar o role na próxima leitura, `role = 'master'`, e todos os 9 itens do menu voltam a aparecer (Início, Clientes, Máquinas, Leituras, Pagamentos, Extratos, Usuários, Audit log, Reconciliação).

### Resultado esperado

- Sidebar desktop com logo "GruaPro", lista completa de menus, e bloco "Logado como" no rodapé
- Header mobile com botão hambúrguer abrindo o sheet de navegação
- Bottom nav mobile com os 4 primeiros itens (Início, Clientes, Máquinas, Leituras)

