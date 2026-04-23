import { Card } from "@/components/ui/card";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { VariacaoLeitura } from "@/utils/reading-calculations";

interface ReadingCalculationsPanelProps {
  valorFaturadoNum: number;
  comissao: number;
  liquido: number;
  percentual: number;
  saidaPeriodo: number;
  variacao: VariacaoLeitura | null;
}

export function ReadingCalculationsPanel({
  valorFaturadoNum,
  comissao,
  liquido,
  percentual,
  saidaPeriodo,
  variacao
}: ReadingCalculationsPanelProps) {
  if (valorFaturadoNum <= 0) return null;

  return (
    <Card className="p-4 bg-primary/5 border-primary/20 space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bruto Período</div>
          <div className="text-xl font-bold text-primary">{formatBRL(valorFaturadoNum)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Comissão ({percentual}%)</div>
          <div className="text-xl font-bold text-destructive">{formatBRL(comissao)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Líquido (Empresa)</div>
          <div className="text-xl font-bold text-green-600">{formatBRL(liquido)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pelúcias Saídas</div>
          <div className="text-xl font-bold text-orange-500">{saidaPeriodo}</div>
        </div>
      </div>

      {variacao && (
        <div className={`mt-2 p-2 rounded text-xs flex items-center gap-2 ${
          variacao.nivelAlerta === 'critico' ? 'bg-destructive/10 text-destructive' : 
          variacao.nivelAlerta === 'atencao' ? 'bg-amber-100 text-amber-700' : 
          'bg-green-100 text-green-700'
        }`}>
          {variacao.nivelAlerta !== 'normal' ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <TrendingDown className="h-4 w-4 shrink-0" />}
          <div>
            <span className="font-bold">Análise: </span>
            Variação diária: <span className="font-bold">{variacao.variacaoDiaria.toFixed(1)}%</span>. 
            {variacao.nivelAlerta === 'critico' ? ' Queda crítica detectada!' : 
             variacao.nivelAlerta === 'atencao' ? ' Atenção para queda de faturamento.' : 
             ' Desempenho dentro do normal.'}
          </div>
        </div>
      )}
    </Card>
  );
}
