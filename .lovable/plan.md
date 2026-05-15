## Objetivo
Definir a senha `123@mudar!` para o usuário `homero@system.local`.

## Passos
1. Localizar o `id` do usuário em `auth.users` pelo email `homero@system.local` (via read_query) para confirmar que existe.
2. Atualizar a senha usando a API admin do Supabase. Como o projeto já tem a edge function `manage-users` com `SUPABASE_SERVICE_ROLE_KEY`, vou:
   - Adicionar uma nova ação `reset_password` em `supabase/functions/manage-users/index.ts` que aceita `{ action: "reset_password", user_id, new_password }` e chama `adminClient.auth.admin.updateUserById(user_id, { password })`.
   - Restringir a ação a quem tem role `master` ou `admin` (mesma checagem já existente).
3. Após deploy automático, invocar a função uma vez para o usuário Homero com a senha `123@mudar!`, usando `supabase--curl_edge_functions` autenticado como master.
4. Confirmar sucesso (status 200 e ausência de erro nos logs).

## Observações
- A senha não será exposta na UI; só será aplicada via chamada única.
- Não altera dados de perfil nem role do Homero.
- Caso prefira, posso também adicionar um botão "Redefinir senha" na tela de Usuários para usos futuros — diga se quer incluir.