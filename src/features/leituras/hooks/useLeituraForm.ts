import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { saveOfflineLeitura } from "@/services/sync-service";
import { logAudit } from "@/lib/audit";
import { useReadingForm, type MaquinaOpt } from "./useReadingForm";
import { useReadingPhotos } from "./useReadingPhotos";
import { useReadingQR } from "./useReadingQR";
import { useReadingComparison } from "./useReadingComparison";
import { useReadingBatch } from "./useReadingBatch";

export type { MaquinaOpt };

export function useLeituraForm() {
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  const form = useReadingForm();
  const photos = useReadingPhotos();
  const batch = useReadingBatch();

  const comparison = useReadingComparison({
    maquinaId: form.maquinaId,
    contadorEntradaAtual: form.contadorEntradaAtual,
    contadorSaidaAtual: form.contadorSaidaAtual,
    valorPorCredito: form.valorPorCredito,
    percentual: form.percentual,
    setValorPorCredito: form.setValorPorCredito,
  });

  const onMachineSelected = useCallback(
    (id: string, clienteId: string) => {
      form.setMaquinaId(id);
      form.setCurrentClienteId(clienteId);
    },
    [form]
  );
  const qr = useReadingQR(onMachineSelected);

  const resetForm = () => {
    form.resetForm();
    photos.reset();
    comparison.resetComparison();
  };

  const handleSubmit = async (e?: React.FormEvent, proxima: boolean = false) => {
    if (e && (e as any).preventDefault) (e as any).preventDefault();
    const { maquinaSel, percentual } = form;
    const {
      contadorEntradaAnterior, contadorSaidaAnterior,
      entradaAtualNum, saidaAtualNum, vPorCreditoNum,
      saidaPeriodo, valorFaturadoNum, comissao, liquido, variacao,
    } = comparison;

    if (!maquinaSel) { toast.error("Selecione uma máquina"); return; }
    if (entradaAtualNum < contadorEntradaAnterior && entradaAtualNum > 0) {
      toast.error("O contador de entrada digitado é menor que o anterior."); return;
    }
    if (saidaAtualNum < contadorSaidaAnterior && saidaAtualNum > 0) {
      toast.error("O contador de saída digitado é menor que o anterior."); return;
    }
    if (entradaAtualNum <= 0 || saidaAtualNum <= 0) {
      toast.error("Digite os contadores atuais"); return;
    }
    if (!user) { toast.error("Sessão expirada"); return; }

    if (variacao?.nivelAlerta === "critico" && !form.showConfirm) {
      form.setIsSubmitNext(proxima);
      form.setShowConfirm(true);
      return;
    }

    form.setSaving(true);
    try {
      if (isOnline) {
        const { data: leitura, error } = await supabase
          .from("leituras")
          .insert({
            maquina_id: maquinaSel.id,
            cliente_id: maquinaSel.cliente_id,
            usuario_id: user.id,
            valor_faturado: valorFaturadoNum,
            pelucias_saidas: saidaPeriodo,
            contador_entrada_atual: entradaAtualNum,
            contador_saida_atual: saidaAtualNum,
            contador_entrada_anterior: contadorEntradaAnterior,
            contador_saida_anterior: contadorSaidaAnterior,
            valor_por_credito: vPorCreditoNum,
            valor_comissao: comissao,
            valor_liquido: liquido,
            percentual_aplicado: percentual,
            observacoes: form.observacoes || null,
            status: "pendente",
          })
          .select("id")
          .single();
        if (error) throw error;

        await photos.uploadAllPhotos(leitura.id);

        await logAudit({
          acao: "CREATE_LEITURA",
          tabela: "leituras",
          registro_id: leitura.id,
          dados_depois: { valor_faturado: valorFaturadoNum, comissao, percentual },
        });

        toast.success(`Leitura de ${maquinaSel.codigo_identificacao} registrada!`);
        batch.registerOnline(maquinaSel.id, leitura.id);

        if (proxima) {
          resetForm();
        } else {
          batch.finalizeOnline(leitura.id);
        }
      } else {
        const fotosData = await photos.getCompressedPhotosForOffline();
        await saveOfflineLeitura(
          {
            maquina_id: maquinaSel.id,
            cliente_id: maquinaSel.cliente_id,
            usuario_id: user.id,
            valor_faturado: valorFaturadoNum,
            pelucias_saidas: saidaPeriodo,
            contador_entrada_atual: entradaAtualNum,
            contador_saida_atual: saidaAtualNum,
            contador_entrada_anterior: contadorEntradaAnterior,
            contador_saida_anterior: contadorSaidaAnterior,
            valor_por_credito: vPorCreditoNum,
            valor_comissao: comissao,
            valor_liquido: liquido,
            percentual_comissao: percentual,
            observacoes: form.observacoes || undefined,
            data_leitura: new Date().toISOString(),
          },
          fotosData
        );

        toast.success(`Leitura salva offline!`);
        batch.registerOffline(maquinaSel.id);
        if (proxima) resetForm();
        else batch.finalizeOffline();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      form.setSaving(false);
    }
  };

  return {
    // maquinas / selection
    maquinas: form.maquinas,
    maquinaId: form.maquinaId,
    setMaquinaId: form.setMaquinaId,
    isScanning: qr.isScanning,
    setIsScanning: qr.setIsScanning,
    // counters / form fields
    contadorEntradaAtual: form.contadorEntradaAtual,
    setContadorEntradaAtual: form.setContadorEntradaAtual,
    contadorSaidaAtual: form.contadorSaidaAtual,
    setContadorSaidaAtual: form.setContadorSaidaAtual,
    valorPorCredito: form.valorPorCredito,
    setValorPorCredito: form.setValorPorCredito,
    observacoes: form.observacoes,
    setObservacoes: form.setObservacoes,
    // photos
    fotos: photos.fotos,
    previews: photos.previews,
    handleFiles: photos.handleFiles,
    removeFoto: photos.removeFoto,
    // submit + comparison
    saving: form.saving,
    ultimaLeitura: comparison.ultimaLeitura,
    variacao: comparison.variacao,
    showConfirm: form.showConfirm,
    setShowConfirm: form.setShowConfirm,
    currentClienteId: form.currentClienteId,
    setCurrentClienteId: form.setCurrentClienteId,
    leiturasRealizadas: batch.leiturasRealizadas,
    isSubmitNext: form.isSubmitNext,
    handleSubmit,
    maquinaSel: form.maquinaSel,
    percentual: form.percentual,
    contadorEntradaAnterior: comparison.contadorEntradaAnterior,
    contadorSaidaAnterior: comparison.contadorSaidaAnterior,
    entradaPeriodo: comparison.entradaPeriodo,
    saidaPeriodo: comparison.saidaPeriodo,
    valorFaturadoNum: comparison.valorFaturadoNum,
    comissao: comparison.comissao,
    liquido: comparison.liquido,
    resetForm,
    isOnline,
  };
}