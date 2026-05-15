import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface MaquinaOpt {
  id: string;
  codigo_identificacao: string;
  cliente_id: string;
  clientes: { nome_ponto: string; percentual_comissao: number };
}

export function useReadingForm() {
  const [searchParams] = useSearchParams();
  const maquinaIdParam = searchParams.get("maquina_id") || searchParams.get("maquina");
  const clienteIdParam = searchParams.get("cliente_id") || searchParams.get("cliente");

  const [maquinas, setMaquinas] = useState<MaquinaOpt[]>([]);
  const [maquinaId, setMaquinaId] = useState(maquinaIdParam || "");
  const [contadorEntradaAtual, setContadorEntradaAtual] = useState("");
  const [contadorSaidaAtual, setContadorSaidaAtual] = useState("");
  const [valorPorCredito, setValorPorCredito] = useState("1,00");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitNext, setIsSubmitNext] = useState(false);
  const [currentClienteId, setCurrentClienteId] = useState<string | null>(clienteIdParam || null);

  useEffect(() => {
    const fetchMaquinas = async () => {
      const { data, error } = await supabase
        .from("maquinas")
        .select(`
          id,
          codigo_identificacao,
          cliente_id,
          clientes:cliente_id (
            nome_ponto,
            percentual_comissao
          )
        `)
        .eq("status", "ativa")
        .order("codigo_identificacao");

      if (error) {
        console.error("Erro ao carregar máquinas:", error);
        return;
      }
      if (data) {
        const mapped = data.map((m: any) => {
          // Try to get from joined clientes (relational) or clients:cliente_id (explicit join)
          const clientData = m.clientes || m.clientes_cliente_id;
          return {
            id: m.id,
            codigo_identificacao: m.codigo_identificacao,
            cliente_id: m.cliente_id,
            clientes: {
              nome_ponto: clientData?.nome_ponto,
              percentual_comissao: clientData?.percentual_comissao || 0,
            },
          };
        });
        setMaquinas(mapped as MaquinaOpt[]);
      }
    };
    fetchMaquinas();
  }, []);

  const maquinaSel = useMemo(
    () => maquinas.find((m) => m.id === maquinaId),
    [maquinas, maquinaId]
  );

  useEffect(() => {
    if (maquinaSel) setCurrentClienteId(maquinaSel.cliente_id);
  }, [maquinaSel]);

  const percentual = maquinaSel?.clientes?.percentual_comissao || 0;

  const resetForm = () => {
    setMaquinaId("");
    setContadorEntradaAtual("");
    setContadorSaidaAtual("");
    setObservacoes("");
    setCurrentClienteId(null);
  };

  return {
    maquinas,
    maquinaId,
    setMaquinaId,
    contadorEntradaAtual,
    setContadorEntradaAtual,
    contadorSaidaAtual,
    setContadorSaidaAtual,
    valorPorCredito,
    setValorPorCredito,
    observacoes,
    setObservacoes,
    saving,
    setSaving,
    showConfirm,
    setShowConfirm,
    isSubmitNext,
    setIsSubmitNext,
    currentClienteId,
    setCurrentClienteId,
    maquinaSel,
    percentual,
    resetForm,
  };
}