import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { db } from "@/lib/db";

const CHECK_INTERVAL_MS = 60_000;

export function useUpdatePrompt() {
  const [updating, setUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => {
          /* offline ou erro de rede — silencioso */
        });
      }, CHECK_INTERVAL_MS);
    },
    onRegisterError(err) {
      console.warn("[PWA] register error", err);
    },
  });

  const updateApp = async () => {
    try {
      const pendingCount = await db.pendingLeituras
        .where("status")
        .equals("pending")
        .count();

      if (pendingCount > 0) {
        const proceed = window.confirm(
          `Você tem ${pendingCount} leitura(s) não sincronizada(s). ` +
            `Atualizar agora pode causar perda. Deseja continuar mesmo assim?`,
        );
        if (!proceed) return;
      }
    } catch {
      // se a contagem falhar, não bloqueia o update
    }
    setUpdating(true);
    await updateServiceWorker(true);
  };

  return {
    needRefresh,
    updating,
    updateApp,
    dismiss: () => setNeedRefresh(false),
  };
}