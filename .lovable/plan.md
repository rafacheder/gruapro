## Contexto

Na tela **Leituras**, o checkbox de seleção e os botões "Relatório (N) → PDF A4 / Bobina 57mm" estão hoje restritos a usuários com role `admin` ou `master`. Operadores comuns (`usuario`) não conseguem selecionar leituras nem gerar relatórios consolidados.

Sobre a diferença preview vs. público: confirmei no banco que existem só 2 usuários (`master` e `admin`), então ambos têm permissão. A ausência do checkbox no print do site público provavelmente é um cache antigo do navegador (PWA/service worker) — o deploy do código é o mesmo. Após esta mudança o checkbox estará visível para todos os roles, eliminando essa dúvida de uma vez.

## O que vai mudar

Em `src/features/leituras/LeiturasList.tsx`:

1. **Checkbox de seleção** (linha 237) — remover a condição `{isAdmin && ...}`, deixando o checkbox visível para qualquer usuário autenticado.
2. **Botão "Relatório (N)" + dropdown PDF A4 / Bobina 57mm** (linhas 160-196) — já é controlado apenas por `selectedIds.length > 0`, então passa a aparecer automaticamente para operadores assim que eles selecionarem itens. Nenhuma mudança extra.
3. **Botão "Pagar" rápido por linha** (linha 292) — **manter** restrito a `isAdmin`. Registrar pagamento é uma ação financeira sensível e a tabela `pagamentos` exige role admin/master via RLS. Liberar o botão para operador só geraria erro de permissão.
4. **Validação de pagamento em lote** (linhas 45-56) — **manter** como está. O dialog de registrar pagamento continua sendo admin-only.

## O que NÃO muda

- RLS no banco — operadores já têm `SELECT` nas suas próprias leituras, então a geração de PDF funciona normalmente para os dados que eles veem.
- Permissões financeiras (`canSeeFinancials`) — operador continua sem ver valores de comissão.
- A rota `/leituras/consolidado` — já é acessível para qualquer autenticado.

## Detalhes técnicos

```text
LeiturasList.tsx
├── linha 237: {isAdmin && (<input type="checkbox" .../>)}  → remover guard isAdmin
└── linha 292: {isAdmin && l.status === 'pendente' && ...}  → MANTER (ação de pagamento)
```

Após a mudança, vou também sugerir que você **force refresh** (Ctrl+Shift+R) no site público uma vez para descartar o cache antigo do service worker.
