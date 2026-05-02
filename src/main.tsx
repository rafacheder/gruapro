import { createRoot } from "react-dom/client";
import App from "./App.tsx";
 import { RootErrorBoundary } from "./components/RootErrorBoundary";
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

 createRoot(document.getElementById("root")!).render(
   <RootErrorBoundary>
     <App />
   </RootErrorBoundary>
 );
