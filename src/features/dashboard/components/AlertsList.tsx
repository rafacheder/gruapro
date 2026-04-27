import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/format";

interface AlertsListProps {
  alertas: any[];
  loadingAlerts: boolean;
}

function AlertsListImpl({ alertas, loadingAlerts }: AlertsListProps) {
  const navigate = useNavigate();

  return (
    <Card className="mt-6 overflow-hidden border-border">
      <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Máquinas em alerta
        </h3>
        {alertas.length > 0 && (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            {alertas.length} {alertas.length === 1 ? 'máquina' : 'máquinas'}
          </Badge>
        )}
      </div>
      <div className="p-0">
        {loadingAlerts ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
        ) : alertas.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="flex justify-center"><CheckCircle2 className="h-10 w-10 text-success/40" /></div>
            <p className="text-sm text-muted-foreground">✅ Nenhuma máquina em alerta no momento</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {alertas.map((l) => (
              <div 
                key={l.id} 
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between group"
                onClick={() => navigate(`/leituras/${l.id}`)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{l.maquinas?.codigo_identificacao}</span>
                    <span className="text-xs text-muted-foreground">• {l.clientes?.nome_ponto}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold ${l.variacao.nivelAlerta === 'critico' ? 'text-destructive' : 'text-warning'}`}>
                      Queda de {Math.abs(Math.round(l.variacao.variacaoDiaria))}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Leitura em {formatDate(l.data_leitura)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export const AlertsList = memo(AlertsListImpl);
