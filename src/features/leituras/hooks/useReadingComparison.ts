import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calcComissao } from "@/lib/format";
import { calcularVariacao, type VariacaoLeitura } from "@/utils/reading-calculations";

interface Params {
  maquinaId: string;
  contadorEntradaAtual: string;
  contadorSaidaAtual: string;
  valorPorCredito: string;
  percentual: number;
  setValorPorCredito: (v: string) => void;
}

export function useReadingComparison({
  maquinaId,
  contadorEntradaAtual,
  contadorSaidaAtual,
  valorPorCredito,
  percentual,
  setValorPorCredito,
}: Params) {
  const [ultimaLeitura, setUltimaLeitura] = useState<any | null>(null);
  const [variacao, setVariacao] = useState<VariacaoLeitura | null>(null);

  useEffect(() => {
    if (!maquinaId) {
      setUltimaLeitura(null);
      return;
    }
    let cancelled = false;
    async function fetchLast() {
      const { data: maquina } = await supabase
        .from("maquinas")
        .select("valor_por_credito, contador_entrada_inicial, contador_saida_inicial")
        .eq("id", maquinaId)
        .maybeSingle();
      if (cancelled) return;
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
      if (cancelled) return;
      if (data) {
        setUltimaLeitura(data);
      } else if (maquina) {
        setUltimaLeitura({
          contador_entrada_atual: maquina.contador_entrada_inicial || 0,
          contador_saida_atual: maquina.contador_saida_inicial || 0,
          data_leitura: null,
          is_baseline: true,
        });
      }
    }
    fetchLast();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maquinaId]);

  const contadorEntradaAnterior = ultimaLeitura?.contador_entrada_atual ?? 0;
  const contadorSaidaAnterior = ultimaLeitura?.contador_saida_atual ?? 0;
  const entradaAtualNum = parseInt(contadorEntradaAtual) || 0;
  const saidaAtualNum = parseInt(contadorSaidaAtual) || 0;
  const vPorCreditoNum = parseFloat(valorPorCredito.replace(",", ".")) || 1.0;
  const entradaPeriodo = entradaAtualNum > 0 ? entradaAtualNum - contadorEntradaAnterior : 0;
  const saidaPeriodo = saidaAtualNum > 0 ? saidaAtualNum - contadorSaidaAnterior : 0;
  const valorFaturadoNum = entradaPeriodo > 0 ? entradaPeriodo * vPorCreditoNum : 0;
  const { comissao, liquido } = useMemo(
    () => calcComissao(valorFaturadoNum, percentual),
    [valorFaturadoNum, percentual]
  );

  useEffect(() => {
    if (ultimaLeitura && entradaAtualNum > 0) {
      const v = calcularVariacao(
        { valor_faturado: valorFaturadoNum, pelucias_saidas: saidaPeriodo, data_leitura: new Date().toISOString() },
        {
          valor_faturado: Number(ultimaLeitura.valor_faturado) || 0,
          pelucias_saidas: Number(ultimaLeitura.pelucias_saidas) || 0,
          data_leitura: ultimaLeitura.data_leitura || new Date().toISOString(),
          data_leitura_previa: ultimaLeitura.data_leitura_previa,
        }
      );
      setVariacao(v);
    } else {
      setVariacao(null);
    }
  }, [ultimaLeitura, valorFaturadoNum, saidaPeriodo, entradaAtualNum]);

  const resetComparison = () => {
    setUltimaLeitura(null);
    setVariacao(null);
  };

  return {
    ultimaLeitura,
    variacao,
    contadorEntradaAnterior,
    contadorSaidaAnterior,
    entradaAtualNum,
    saidaAtualNum,
    vPorCreditoNum,
    entradaPeriodo,
    saidaPeriodo,
    valorFaturadoNum,
    comissao,
    liquido,
    resetComparison,
  };
}