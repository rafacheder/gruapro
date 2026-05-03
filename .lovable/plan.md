## Problema

Atualmente o QR scanner usa `Html5QrcodeScanner` que renderiza uma UI completa com botões "Request Camera Permissions" e "Scan an Image File". O operador precisa clicar novamente para abrir a câmera, o que é desnecessário.

## Solução

Substituir `Html5QrcodeScanner` por `Html5Qrcode` (a API de nível mais baixo da mesma biblioteca). Isso permite iniciar a câmera traseira diretamente via `html5Qrcode.start()` com `facingMode: "environment"`, sem UI intermediária.

## Mudanças

### `src/features/leituras/hooks/useLeituraForm.ts`

1. Trocar o import de `Html5QrcodeScanner` para `Html5Qrcode`.
2. Alterar o `scannerRef` para `useRef<Html5Qrcode | null>`.
3. No `useEffect` de scanning, substituir a lógica:
   - Criar `new Html5Qrcode("qr-reader")`
   - Chamar `scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {})`
   - Isso abre a câmera traseira automaticamente sem nenhum clique adicional.
4. No cleanup, chamar `scanner.stop()` em vez de `scanner.clear()`.

Nenhuma outra alteração necessária -- o container `#qr-reader` no `MachineSelector.tsx` continua sendo usado.
