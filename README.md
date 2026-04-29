# Welcome to your Lovable project

TODO: Document your project here

## Fluxo de release (PWA auto-update)

1. Incrementar `APP_VERSION` em `src/config/version.ts` (e atualizar `APP_VERSION_DATE`).
2. Commit + deploy.
3. Em até ~60 segundos após o deploy, todos os clientes com o app aberto verão o banner **"Nova versão disponível"** no topo da tela.
4. Ao clicar em **Atualizar agora**, o service worker novo assume e o app recarrega na versão nova.
5. Antes de atualizar, o app verifica leituras pendentes no IndexedDB e pede confirmação se houver risco de perda.
6. Usuários offline pegam a nova versão automaticamente quando reconectarem.

### Cleanup de caches antigos

O Workbox está configurado com `cleanupOutdatedCaches: true`, então caches de versões antigas são removidos automaticamente quando o novo SW é ativado.

### Preview / iframe

Em `id-preview--*.lovable.app`, `lovableproject.com` e dentro de iframes, o registro do service worker é **ignorado** e qualquer SW residual é desregistrado, para evitar conteúdo obsoleto durante o desenvolvimento. O auto-update só funciona no domínio publicado/custom.
