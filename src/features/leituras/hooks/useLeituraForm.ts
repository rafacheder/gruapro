import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { saveOfflineLeitura } from "@/services/sync-service";
import { logAudit } from "@/lib/audit";
import { calcComissao } from "@/lib/format";
import { calcularVariacao, type VariacaoLeitura } from "@/utils/reading-calculations";
import { Html5QrcodeScanner } from "html5-qrcode";

export interface MaquinaOpt {
  id: string;
  codigo_identificacao: string;
  cliente_id: string;
  clientes: { nome_ponto: string; percentual_comissao: number };
}

async function compressImage(file: File, maxWidth = 1600, quality = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality));
}

export function useLeituraForm() {
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [maquinas, setMaquinas] = useState<MaquinaOpt[]>([]);
  const maquinaIdParam = searchParams.get("maquina_id") || searchParams.get("maquina");
  const [maquinaId, setMaquinaId] = useState(maquinaIdParam || "");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [contadorEntradaAtual, setContadorEntradaAtual] = useState("");
  const [contadorSaidaAtual, setContadorSaidaAtual] = useState("");
  const [valorPorCredito, setValorPorCredito] = useState("1,00");
  const [observacoes, setObservacoes] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [ultimaLeitura, setUltimaLeitura] = useState<any | null>(null);
  const [variacao, setVariacao] = useState<VariacaoLeitura | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentClienteId, setCurrentClienteId] = useState<string | null>(null);
  const [leiturasRealizadas, setLeiturasRealizadas] = useState<string[]>([]);
  const [isSubmitNext, setIsSubmitNext] = useState(false);

  const handleSelectMachine = useCallback(async (id: string) => {
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
    setMaquinaId(id);
    setCurrentClienteId(maquinaData.cliente_id);
    setIsScanning(false);
    toast.success("Máquina selecionada via QR Code!");
  }, []);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    try {
      const url = new URL(decodedText);
      const mid = url.searchParams.get("maquina_id");
      if (mid) await handleSelectMachine(mid);
      else toast.error("QR Code inválido para este sistema");
    } catch {
      toast.error("QR Code não contém uma URL válida");
    }
  }, [handleSelectMachine]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isScanning && !scannerRef.current) {
      timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
        scannerRef.current = scanner;
        scanner.render(onScanSuccess, () => {});
      }, 100);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Error clearing scanner:", err));
        scannerRef.current = null;
      }
    };
  }, [isScanning, onScanSuccess]);

  useEffect(() => {
    supabase
      .from("maquinas")
      .select("id, codigo_identificacao, cliente_id, clientes(nome_ponto, percentual_comissao)")
      .eq("status", "ativa")
      .order("codigo_identificacao")
      .then(({ data }) => setMaquinas((data as unknown as MaquinaOpt[]) || []));
  }, []);

  useEffect(() => {
    if (!maquinaId) { setUltimaLeitura(null); return; }
    async function fetchLast() {
      const { data: maquina } = await supabase
        .from("maquinas")
        .select("valor_por_credito, contador_entrada_inicial, contador_saida_inicial")
        .eq("id", maquinaId)
        .maybeSingle();
      if (maquina) {
        setValorPorCredito(maquina.valor_por_credito?.toString().replace(".", ",") || "1,00");
      }
      const { data } = await supabase
        .from("vw_leituras_com_anterior")
        .select("*")
        .eq("maquina_id", maquinaId)
        .order("data_leitura", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setUltimaLeitura(data);
      } else if (maquina) {
        setUltimaLeitura({
          contador_entrada_atual: maquina.contador_entrada_inicial || 0,
          contador_saida_atual: maquina.contador_saida_inicial || 0,
          data_leitura: null,
          is_baseline: true
        });
      }
    }
    fetchLast();
  }, [maquinaId]);

  const maquinaSel = useMemo(() => maquinas.find((m) => m.id === maquinaId), [maquinas, maquinaId]);

  useEffect(() => {
    if (maquinaSel) setCurrentClienteId(maquinaSel.cliente_id);
  }, [maquinaSel]);

  const percentual = maquinaSel?.clientes?.percentual_comissao || 0;
  const contadorEntradaAnterior = ultimaLeitura?.contador_entrada_atual ?? 0;
  const contadorSaidaAnterior = ultimaLeitura?.contador_saida_atual ?? 0;
  const entradaAtualNum = parseInt(contadorEntradaAtual) || 0;
  const saidaAtualNum = parseInt(contadorSaidaAtual) || 0;
  const vPorCreditoNum = parseFloat(valorPorCredito.replace(",", ".")) || 1.0;
  const entradaPeriodo = entradaAtualNum > 0 ? entradaAtualNum - contadorEntradaAnterior : 0;
  const saidaPeriodo = saidaAtualNum > 0 ? saidaAtualNum - contadorSaidaAnterior : 0;
  const valorFaturadoNum = entradaPeriodo > 0 ? entradaPeriodo * vPorCreditoNum : 0;
  const { comissao, liquido } = useMemo(() => calcComissao(valorFaturadoNum, percentual), [valorFaturadoNum, percentual]);

  useEffect(() => {
    if (ultimaLeitura && entradaAtualNum > 0) {
      const v = calcularVariacao(
        { valor_faturado: valorFaturadoNum, pelucias_saidas: saidaPeriodo, data_leitura: new Date().toISOString() },
        {
          valor_faturado: Number(ultimaLeitura.valor_faturado) || 0,
          pelucias_saidas: Number(ultimaLeitura.pelucias_saidas) || 0,
          data_leitura: ultimaLeitura.data_leitura || new Date().toISOString(),
          data_leitura_previa: ultimaLeitura.data_leitura_previa
        }
      );
      setVariacao(v);
    } else {
      setVariacao(null);
    }
  }, [ultimaLeitura, valorFaturadoNum, saidaPeriodo, entradaAtualNum]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const remaining = 5 - fotos.length;
    const accepted = list.slice(0, remaining);
    if (list.length > remaining) toast.warning(`Máximo de 5 fotos. ${remaining} aceita(s).`);
    setFotos((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
  };

  const removeFoto = (i: number) => {
    setFotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const resetForm = () => {
    setMaquinaId("");
    setContadorEntradaAtual("");
    setContadorSaidaAtual("");
    setObservacoes("");
    setFotos([]);
    setPreviews([]);
    setUltimaLeitura(null);
    setVariacao(null);
    setCurrentClienteId(null); // Fix: Reset customer filter when resetting form
  };

  const handleSubmit = async (e?: React.FormEvent, proxima: boolean = false) => {
    if (e && (e as any).preventDefault) (e as any).preventDefault();
    if (!maquinaSel) { toast.error("Selecione uma máquina"); return; }
    if (entradaAtualNum < contadorEntradaAnterior && entradaAtualNum > 0) {
      toast.error("O contador de entrada digitado é menor que o anterior.");
      return;
    }
    if (saidaAtualNum < contadorSaidaAnterior && saidaAtualNum > 0) {
      toast.error("O contador de saída digitado é menor que o anterior.");
      return;
    }
    if (entradaAtualNum <= 0 || saidaAtualNum <= 0) {
      toast.error("Digite os contadores atuais");
      return;
    }
    if (!user) { toast.error("Sessão expirada"); return; }

    if (variacao?.nivelAlerta === 'critico' && !showConfirm) {
      setIsSubmitNext(proxima);
      setShowConfirm(true);
      return;
    }

    setSaving(true);
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
            observacoes: observacoes || null,
            status: "pendente",
          })
          .select("id")
          .single();
        if (error) throw error;

        for (let i = 0; i < fotos.length; i++) {
          const blob = await compressImage(fotos[i]);
          const path = `${leitura.id}/${i + 1}-${Date.now()}.jpg`;
          const { error: upErr } = await supabase.storage.from("leitura-fotos").upload(path, blob, { contentType: "image/jpeg" });
          if (upErr) { console.error(upErr); continue; }
          const { data: pub } = supabase.storage.from("leitura-fotos").getPublicUrl(path);
          await supabase.from("leitura_fotos").insert({ leitura_id: leitura.id, foto_url: pub.publicUrl, ordem: i + 1 });
        }

        await logAudit({
          acao: "CREATE_LEITURA",
          tabela: "leituras",
          registro_id: leitura.id,
          dados_depois: { valor_faturado: valorFaturadoNum, comissao, percentual },
        });

        toast.success(`Leitura de ${maquinaSel.codigo_identificacao} registrada!`);
        setLeiturasRealizadas(prev => [...prev, maquinaSel.id]);

        const sessionIds = JSON.parse(sessionStorage.getItem("session_leituras") || "[]");
        sessionIds.push(leitura.id);
        sessionStorage.setItem("session_leituras", JSON.stringify(sessionIds));

        if (proxima) {
          resetForm();
        } else {
          const ids = JSON.parse(sessionStorage.getItem("session_leituras") || "[]");
          sessionStorage.removeItem("session_leituras");
          if (ids.length > 1) navigate(`/leituras/consolidado?ids=${ids.join(",")}`);
          else navigate(`/leituras/${leitura.id}`);
        }
      } else {
        const fotosData = [];
        for (let i = 0; i < fotos.length; i++) {
          const blob = await compressImage(fotos[i]);
          fotosData.push({ campo: `foto_${i + 1}`, blob, fileName: `${i + 1}-${Date.now()}.jpg` });
        }
        await saveOfflineLeitura({
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
          observacoes: observacoes || undefined,
          data_leitura: new Date().toISOString(),
        }, fotosData);

        toast.success(`Leitura salva offline!`);
        setLeiturasRealizadas(prev => [...prev, maquinaSel.id]);
        if (proxima) resetForm();
        else navigate("/leituras");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return {
    maquinas, maquinaId, setMaquinaId, isScanning, setIsScanning,
    contadorEntradaAtual, setContadorEntradaAtual,
    contadorSaidaAtual, setContadorSaidaAtual,
    valorPorCredito, setValorPorCredito,
    observacoes, setObservacoes,
    fotos, previews, handleFiles, removeFoto,
    saving, ultimaLeitura, variacao,
    showConfirm, setShowConfirm,
    currentClienteId, setCurrentClienteId,
    leiturasRealizadas, isSubmitNext,
    handleSubmit, maquinaSel, percentual,
    contadorEntradaAnterior, contadorSaidaAnterior,
    entradaPeriodo, saidaPeriodo, valorFaturadoNum,
    comissao, liquido, resetForm, isOnline
  };
}
