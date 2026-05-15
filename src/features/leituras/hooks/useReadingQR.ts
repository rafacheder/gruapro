import { useState, useRef, useCallback, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useReadingQR(onMachineSelected: (id: string, clienteId: string) => void) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const handleSelectMachine = useCallback(
    async (id: string) => {
      const { data: maquinaData, error } = await supabase
        .from("maquinas")
        .select("id, status, cliente_id")
        .eq("id", id)
        .maybeSingle();

      if (error || !maquinaData) {
        toast.error("Máquina não encontrada");
        return;
      }
      if (maquinaData.status !== "ativa") {
        toast.error(`Máquina está com status: ${maquinaData.status}`);
        return;
      }
      onMachineSelected(id, maquinaData.cliente_id);
      setIsScanning(false);
      toast.success("Máquina selecionada via QR Code!");
    },
    [onMachineSelected]
  );

  const onScanSuccess = useCallback(
    async (decodedText: string) => {
      try {
        const url = new URL(decodedText);
        const mid = url.searchParams.get("maquina_id");
        if (mid) await handleSelectMachine(mid);
        else toast.error("QR Code inválido para este sistema");
      } catch {
        toast.error("QR Code não contém uma URL válida");
      }
    },
    [handleSelectMachine]
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isScanning && !scannerRef.current) {
      timer = setTimeout(() => {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        scanner
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            () => {}
          )
          .catch((err) => {
            console.error("Erro ao iniciar câmera:", err);
          });
      }, 100);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        try {
          if (scanner.getState() !== 1) {
            scanner
              .stop()
              .then(() => {
                try { scanner.clear(); } catch { /* ignore */ }
              })
              .catch((err) => console.warn("Scanner stop error (expected if unmounting):", err));
          }
        } catch (e) {
          console.warn("Scanner cleanup error:", e);
        }
      }
    };
  }, [isScanning, onScanSuccess]);

  return { isScanning, setIsScanning };
}