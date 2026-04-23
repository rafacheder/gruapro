import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
 import { ClipboardList, Plus, Loader2, TrendingDown, TrendingUp, Minus, AlertTriangle, FileText } from "lucide-react";
 import { toast } from "sonner";
import { useAuth, canSeeFinancials } from "@/contexts/AuthContext";
import { formatBRL, formatDateTime, formatPercent } from "@/lib/format";
import { calcularVariacao } from "@/utils/reading-calculations";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

export default function LeiturasList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const showFinancials = canSeeFinancials(role);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("vw_leituras_com_anterior")
      .select("*, maquinas(codigo_identificacao), clientes(nome_ponto)")
      .order("data_leitura", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        const mapped = (data || []).map(l => {
          const variacao = l.data_leitura_previa ? calcularVariacao(
            { valor_faturado: Number(l.valor_faturado), pelucias_saidas: l.pelucias_saidas, data_leitura: l.data_leitura },
            { 
              valor_faturado: Number(l.valor_faturado_previo), 
              pelucias_saidas: l.pelucias_saidas_previa, 
              data_leitura: l.data_leitura_previa,
              data_leitura_previa: l.data_leitura_pre_previa
            }
          ) : null;
          return { ...l, variacao };
        });
        setItems(mapped);
        setFilteredItems(mapped);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(i => i.status === statusFilter));
    }
  }, [statusFilter, items]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Leituras"
        description="Histórico de coletas em campo"
         action={
           <div className="flex gap-2">
             {selectedIds.length > 0 && (
               <Button 
                 onClick={() => {
                   const firstLeitura = items.find(i => i.id === selectedIds[0]);
                   const sameCliente = selectedIds.every(id => {
                     const l = items.find(i => i.id === id);
                     return l?.cliente_id === firstLeitura?.cliente_id;
                   });
                   if (!sameCliente) {
                     toast.error("Todas as leituras selecionadas devem ser do mesmo cliente.");
                     return;
                   }
                   navigate(`/leituras/consolidado?ids=${selectedIds.join(",")}`);
                 }} 
                 variant="outline" 
                 className="border-accent text-accent hover:bg-accent/10"
               >
                 <FileText className="h-4 w-4 mr-2" /> Relatório ({selectedIds.length})
               </Button>
             )}
             <Button onClick={() => navigate("/leituras/nova")} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent">
               <Plus className="h-4 w-4 mr-2" /> Nova
             </Button>
           </div>
         }
      />

      <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
          <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
          <TabsTrigger value="pendente" className="text-xs">Pendentes</TabsTrigger>
          <TabsTrigger value="pago" className="text-xs">Pagas</TabsTrigger>
          <TabsTrigger value="cancelado" className="text-xs">Canceladas</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma leitura encontrada"
          description={statusFilter === 'all' ? "Faça a primeira leitura para começar." : "Nenhuma leitura com este status."}
          action={
            statusFilter === 'all' ? (
              <Button onClick={() => navigate("/leituras/nova")} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" /> Nova leitura
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
           {filteredItems.map((l) => (
             <div key={l.id} className="relative flex items-center gap-2">
               <input 
                 type="checkbox" 
                 checked={selectedIds.includes(l.id)}
                 onChange={(e) => {
                   if (e.target.checked) setSelectedIds([...selectedIds, l.id]);
                   else setSelectedIds(selectedIds.filter(id => id !== l.id));
                 }}
                 className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent ml-2"
               />
               <Link to={`/leituras/${l.id}`} className="flex-1 min-w-0">
                 <Card className="p-4 hover:border-accent transition-colors bg-card flex items-center justify-between gap-3 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  l.status === 'pago' ? 'bg-success' : 
                  l.status === 'pendente' ? 'bg-warning' : 
                  'bg-muted'
                }`} />
                <div className="min-w-0 flex-1 pl-1">
                  <div className="text-sm font-semibold truncate">{l.clientes?.nome_ponto}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {l.maquinas?.codigo_identificacao} • {formatDateTime(l.data_leitura)}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="text-xs text-muted-foreground">
                      {formatBRL(l.valor_faturado)} • {l.pelucias_saidas} pelúcia(s)
                    </div>
                    {l.variacao && (
                      <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
                        l.variacao.nivelAlerta === 'critico' ? 'text-destructive' : 
                        l.variacao.nivelAlerta === 'atencao' ? 'text-warning' : 
                        l.variacao.variacaoDiaria > 5 ? 'text-success' : 'text-muted-foreground'
                      }`}>
                        {l.variacao.variacaoDiaria > 5 ? <TrendingUp className="h-3 w-3" /> : 
                         l.variacao.variacaoDiaria < -5 ? (l.variacao.nivelAlerta === 'critico' ? <AlertTriangle className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />) : 
                         <Minus className="h-3 w-3" />}
                        <span className="hidden sm:inline">{formatPercent(l.variacao.variacaoDiaria)}</span>
                      </div>
                    )}
                  </div>
                </div>
                 <div className="text-right shrink-0">
                   {showFinancials && (
                     <div className="text-sm font-bold text-accent">{formatBRL(l.valor_comissao)}</div>
                   )}
                   <Badge 
                     variant={l.status === "pago" ? "default" : "secondary"} 
                     className={`mt-1 text-[10px] capitalize ${
                       l.status === 'pago' ? 'bg-success/20 text-success hover:bg-success/30 border-success/30' : 
                       l.status === 'pendente' ? 'bg-warning/20 text-warning hover:bg-warning/30 border-warning/30' : 
                       ''
                     }`}
                   >
                     {l.status}
                   </Badge>
                 </div>
               </Card>
               </Link>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
