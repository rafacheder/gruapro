import { createRoot } from "react-dom/client";
import App from "./App.tsx";
 import { RootErrorBoundary } from "./components/RootErrorBoundary";
import { APP_VERSION } from "./config/version";
import "./index.css";

// Guard: nunca registrar service worker dentro de iframes ou hosts de preview.
// O vite-plugin-pwa registrará o SW via virtual:pwa-register quando o app
// estiver hospedado fora desses contextos. Em iframe/preview, removemos
// qualquer SW residual para evitar conteúdo obsoleto.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app"));

if ((isPreviewHost || isInIframe) && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

async function clearOldCachesIfVersionChanged() {
  try {
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion !== APP_VERSION) {
      console.log(`Versão mudou de ${storedVersion} para ${APP_VERSION}. Limpando caches.`);
      
      // 1. Limpar todos os caches do Service Worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // 2. Desregistrar service workers antigos
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // 3. Limpar localStorage e sessionStorage (preservar token de auth)
      const authKeys = Object.keys(localStorage).filter(k => 
        k.startsWith('sb-') || k.includes('supabase')
      );
      const authData: Record<string, string> = {};
      authKeys.forEach(k => {
        const v = localStorage.getItem(k);
        if (v) authData[k] = v;
      });
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Restaurar auth
      Object.entries(authData).forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });
      
      // 4. Marcar nova versão
      localStorage.setItem('app_version', APP_VERSION);
      
      // 5. Forçar reload limpo
      if (storedVersion) {
        // só recarrega se NÃO for primeira instalação
        window.location.reload();
        return;
      } else {
        localStorage.setItem('app_version', APP_VERSION);
      }
    }
  } catch (e) {
    console.error('Erro ao limpar caches:', e);
    // Não bloquear o boot do app por erro de cache
  }
}

// Aguardar limpeza antes de renderizar
clearOldCachesIfVersionChanged().then(() => {
  createRoot(document.getElementById("root")!).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
});
