import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { formatBRL } from "@/lib/format";

interface ReadingSummaryProps {
  ultimaLeitura: any;
}

export function ReadingSummary({ ultimaLeitura }: ReadingSummaryProps) {
  if (!ultimaLeitura) return null;

  const diasUltimaLeitura = ultimaLeitura.data_leitura 
    ? differenceInDays(new Date(), parseISO(ultimaLeitura.data_leitura)) 
    : 0;

  return (
    <Card className="p-4 mb-4 bg-secondary/30 border-secondary/50">
      <div className="flex items-center gap-2 mb-2 text-secondary-foreground font-medium text-sm">
        <Info className="h-4 w-4" />
        📊 Última leitura: {ultimaLeitura.data_leitura ? format(parseISO(ultimaLeitura.data_leitura), "dd/MM/yyyy") : "Baseline"} (há {diasUltimaLeitura} dias)
      </div>
      <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2">
        <div>Entrada: <span className="font-semibold">{ultimaLeitura.contador_entrada_atual || 0}</span></div>
        <div>Saída: <span className="font-semibold">{ultimaLeitura.contador_saida_atual || 0}</span></div>
        {ultimaLeitura.valor_faturado !== undefined && (
          <div>Faturamento: <span className="font-semibold">{formatBRL(ultimaLeitura.valor_faturado)}</span></div>
        )}
      </div>
    </Card>
  );
}
