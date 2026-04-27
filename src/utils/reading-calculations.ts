import { ALERT_THRESHOLDS } from '@/config/alertas';

const MS_DAY = 86_400_000;

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

  const tAtual = new Date(leituraAtual.data_leitura).getTime();
  const tAnterior = new Date(leituraAnterior.data_leitura).getTime();

  // Dias entre a leitura atual e a anterior (mínimo 1)
  const diasEntreLeituras = Math.max(1, Math.floor((tAtual - tAnterior) / MS_DAY));
  const faturamentoPorDia = leituraAtual.valor_faturado / diasEntreLeituras;

  // Cálculo do faturamento diário da leitura anterior (precisa do predecessor dela)
  let faturamentoDiaAnterior = 0;
  if (leituraAnterior.data_leitura_previa) {
    const tPrevia = new Date(leituraAnterior.data_leitura_previa).getTime();
    const diasAnterior = Math.max(1, Math.floor((tAnterior - tPrevia) / MS_DAY));
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