import { differenceInDays, parseISO } from 'date-fns';
import { ALERT_THRESHOLDS } from '@/config/alertas';

export interface VariacaoLeitura {
  variacaoFaturamento: number; // % variação no valor_faturado
  variacaoPelucias: number;     // % variação nas pelucias_saidas
  diasEntreLeituras: number;
  faturamentoPorDia: number;    // valor_faturado / diasEntreLeituras
  faturamentoDiaAnterior: number;
  variacaoDiaria: number;       // variação normalizada por dia (mais justa)
  nivelAlerta: 'normal' | 'atencao' | 'critico';
}

export function calcularVariacao(
  leituraAtual: { valor_faturado: number; pelucias_saidas: number; data_leitura: string },
  leituraAnterior: { 
    valor_faturado: number; 
    pelucias_saidas: number; 
    data_leitura: string;
    data_leitura_previa?: string | null;
  } | null
): VariacaoLeitura | null {
  if (!leituraAnterior) return null;

  const dataAtual = parseISO(leituraAtual.data_leitura);
  const dataAnterior = parseISO(leituraAnterior.data_leitura);
  
  // Dias entre a leitura atual e a anterior
  const diasEntreLeituras = Math.max(1, differenceInDays(dataAtual, dataAnterior));
  const faturamentoPorDia = leituraAtual.valor_faturado / diasEntreLeituras;

  // Cálculo do faturamento diário da leitura anterior (precisa do predecessor dela)
  let faturamentoDiaAnterior = 0;
  if (leituraAnterior.data_leitura_previa) {
    const dataPrevia = parseISO(leituraAnterior.data_leitura_previa);
    const diasAnterior = Math.max(1, differenceInDays(dataAnterior, dataPrevia));
    faturamentoDiaAnterior = leituraAnterior.valor_faturado / diasAnterior;
  } else {
    // Se não temos a leitura antes da anterior, usamos o mesmo intervalo como fallback
    // ou apenas comparamos o faturamento total se os períodos forem similares.
    // Mas o mais seguro é não dar alerta se não temos base de comparação diária confiável.
    faturamentoDiaAnterior = faturamentoPorDia; // Assim a variação é 0
  }

  // Variação % no faturamento total
  const variacaoFaturamento = leituraAnterior.valor_faturado > 0 
    ? ((leituraAtual.valor_faturado - leituraAnterior.valor_faturado) / leituraAnterior.valor_faturado) * 100 
    : 0;

  // Variação % nas pelúcias
  const variacaoPelucias = leituraAnterior.pelucias_saidas > 0 
    ? ((leituraAtual.pelucias_saidas - leituraAnterior.pelucias_saidas) / leituraAnterior.pelucias_saidas) * 100 
    : 0;

  // Variação % normalizada por dia (Variação Diária)
  const variacaoDiaria = faturamentoDiaAnterior > 0 
    ? ((faturamentoPorDia - faturamentoDiaAnterior) / faturamentoDiaAnterior) * 100 
    : 0;

  let nivelAlerta: 'normal' | 'atencao' | 'critico' = 'normal';
  
  // Queda é negativa, então variacaoDiaria será algo como -35%
  const queda = -variacaoDiaria;
  
  if (queda > ALERT_THRESHOLDS.CRITICO) {
    nivelAlerta = 'critico';
  } else if (queda > ALERT_THRESHOLDS.ATENCAO) {
    nivelAlerta = 'atencao';
  }

  return {
    variacaoFaturamento,
    variacaoPelucias,
    diasEntreLeituras,
    faturamentoPorDia,
    faturamentoDiaAnterior,
    variacaoDiaria,
    nivelAlerta
  };
}