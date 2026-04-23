import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PeriodType, getPeriodDates } from "@/utils/date-ranges";
import { DateRange } from "react-day-picker";
import { calcularVariacao } from "@/utils/reading-calculations";

interface Stats {
  faturamentoMes: number;
  comissaoPendente: number;
  liquidoMes: number;
  clientesAtivos: number;
  maquinasAtivas: number;
  leiturasMes: number;
  minhasLeiturasHoje: number;
  totalPelucias: number;
}

export function useDashboardStats(role: string | undefined) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>("mes");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [referenceDate, setReferenceDate] = useState<Date | null>(null);

  const periodDates = useMemo(() => {
    const range = customRange?.from
      ? { from: customRange.from, to: (customRange.to ?? customRange.from) as Date }
      : undefined;

    return getPeriodDates(periodType, range, referenceDate ?? new Date());
  }, [periodType, customRange, referenceDate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);

      const { data: latestReading } = await supabase
        .from("leituras")
        .select("data_leitura")
        .order("data_leitura", { ascending: false })
        .limit(1)
        .maybeSingle();

      const effectiveReferenceDate = latestReading?.data_leitura
        ? new Date(latestReading.data_leitura)
        : new Date();

      if (!referenceDate || referenceDate.getTime() !== effectiveReferenceDate.getTime()) {
        setReferenceDate(effectiveReferenceDate);
      }

      const { start, end } = getPeriodDates(
        periodType,
        customRange?.from
          ? { from: customRange.from, to: customRange.to ?? customRange.from }
          : undefined,
        effectiveReferenceDate,
      );

      const [periodoLeituras, clientesAtivos, maquinasAtivas, minhasHoje] = await Promise.all([
        supabase
          .from("leituras")
          .select("valor_faturado, valor_comissao, valor_liquido, status, pelucias_saidas")
          .gte("data_leitura", start.toISOString())
          .lte("data_leitura", end.toISOString()),
        supabase.from("clientes").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("maquinas").select("id", { count: "exact", head: true }).eq("status", "ativa"),
        supabase
          .from("leituras")
          .select("id", { count: "exact", head: true })
          .gte("data_leitura", inicioHoje.toISOString()),
      ]);

       const rows = periodoLeituras.data || [];
       
       const initialStats: Stats = {
         faturamentoMes: 0,
         comissaoPendente: 0,
         liquidoMes: 0,
         clientesAtivos: clientesAtivos.count || 0,
         maquinasAtivas: maquinasAtivas.count || 0,
         leiturasMes: rows.length,
         minhasLeiturasHoje: minhasHoje.count || 0,
         totalPelucias: 0,
       };
 
       const calculatedStats = rows.reduce((acc, row) => {
         acc.faturamentoMes += Number(row.valor_faturado) || 0;
         acc.liquidoMes += Number(row.valor_liquido) || 0;
         acc.totalPelucias += (row.pelucias_saidas || 0);
         if (row.status === 'pendente') {
           acc.comissaoPendente += Number(row.valor_comissao) || 0;
         }
         return acc;
       }, initialStats);
 
       setStats(calculatedStats);
      setLoading(false);
    };
    load();
  }, [periodDates]);

  useEffect(() => {
    if (role === 'usuario') return;

    const loadAlerts = async () => {
      setLoadingAlerts(true);
      const { data } = await supabase
        .from("vw_leituras_com_anterior")
        .select("*, maquinas(codigo_identificacao), clientes(nome_ponto)")
        .eq("rn_desc", 1);

      if (data) {
        const inAlert = data.map(l => {
          if (!l.data_leitura_previa) return null;
          const v = calcularVariacao(
            { valor_faturado: Number(l.valor_faturado), pelucias_saidas: l.pelucias_saidas, data_leitura: l.data_leitura },
            { 
              valor_faturado: Number(l.valor_faturado_previo), 
              pelucias_saidas: l.pelucias_saidas_previa, 
              data_leitura: l.data_leitura_previa,
              data_leitura_previa: l.data_leitura_pre_previa
            }
          );
          return v && v.nivelAlerta !== 'normal' ? { ...l, variacao: v } : null;
        }).filter(Boolean);
        setAlertas(inAlert as any[]);
      }
      setLoadingAlerts(false);
    };
    loadAlerts();
  }, [role]);

  return {
    stats,
    periodType,
    setPeriodType,
    customRange,
    setCustomRange,
    alertas,
    loading,
    loadingAlerts
  };
}
