  import { useEffect, useState, useMemo, useCallback, memo } from "react";
 import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
  import { ClipboardList, Plus, Loader2, TrendingDown, TrendingUp, Minus, AlertTriangle, FileText, CheckCircle2, XCircle, ChevronDown, Printer } from "lucide-react";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatBRL, formatDateTime, formatPercent } from "@/lib/format";
import { calcularVariacao } from "@/utils/reading-calculations";
 import { ReadingFilters, FilterState } from "./components/ReadingFilters";
 import { startOfMonth, endOfDay, parseISO } from "date-fns";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import RegisterPaymentDialog from "../pagamentos/RegisterPaymentDialog";
 
 interface LeituraRowProps {
   leitura: any;
   checked: boolean;
   showPayButton: boolean;
   showFinancials: boolean;
   onToggle: (id: string, checked: boolean) => void;
   onPay: (id: string, clienteId: string) => void;
 }
 
 const LeituraRow = memo(function LeituraRow({ leitura: l, checked, showPayButton, showFinancials, onToggle, onPay }: LeituraRowProps) {
   return (
     <div className="relative flex items-center gap-2">
       <input
         type="checkbox"
         checked={checked}
         onChange={(e) => onToggle(l.id, e.target.checked)}
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
             <div className="text-sm font-semibold truncate">{l.cliente_nome || l.clientes?.nome_ponto}</div>
             <div className="text-xs text-muted-foreground truncate">
               {l.maquina_codigo || l.maquinas?.codigo_identificacao} • {formatDateTime(l.data_leitura)}
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
           <div className="text-right shrink-0 flex flex-col items-end gap-1">
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
             {l.status === 'pendente' && showPayButton && (
               <Button
                 size="sm"
                 variant="ghost"
                 className="h-7 px-2 text-success hover:text-success hover:bg-success/10 text-[10px]"
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   onPay(l.id, l.cliente_id);
                 }}
               >
                 <CheckCircle2 className="h-3 w-3 mr-1" />
                 Pagar
               </Button>
             )}
           </div>
         </Card>
       </Link>
     </div>
   );
 });
 
 export default function LeiturasList() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { role } = useAuth();
   const [selectedIds, setSelectedIds] = useState<string[]>([]);
   const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
   const [batchSelection, setBatchSelection] = useState<{ids: string[], clienteId: string} | null>(null);
 
    const showFinancials = true;
   const [items, setItems] = useState<any[]>([]);
   const isAdmin = role === 'admin' || role === 'master';
 
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const itemsById = useMemo(() => {
      const m = new Map<string, any>();
      for (const i of items) m.set(i.id, i);
      return m;
    }, [items]);
    const selectedItems = useMemo(() => {
      const out: any[] = [];
      for (const id of selectedIds) {
        const it = itemsById.get(id);
        if (it) out.push(it);
      }
      return out;
    }, [selectedIds, itemsById]);
 
   const totalComissao = useMemo(() => {
     return selectedItems.reduce((acc, curr) => acc + Number(curr.valor_comissao), 0);
   }, [selectedItems]);
 
    const validation = useMemo(() => {
     if (selectedIds.length === 0) return { valid: false, error: null };
     
     const firstClienteId = selectedItems[0]?.cliente_id;
      const sameCliente = selectedItems.every(i => i.cliente_id === firstClienteId);
     if (!sameCliente) return { valid: false, error: "Selecione leituras de um único cliente para registrar pagamento" };
     
     const allPending = selectedItems.every(i => i.status === 'pendente');
     if (!allPending) return { valid: false, error: "Uma ou mais leituras já foram processadas" };
     
     return { valid: true, error: null, clienteId: firstClienteId };
   }, [selectedItems, selectedIds]);
    const toggleSelect = useCallback((id: string, checked: boolean) => {
      setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    }, []);
    const handlePayItem = useCallback((id: string, clienteId: string) => {
      setBatchSelection({ ids: [id], clienteId });
      setPaymentDialogOpen(true);
    }, []);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 50;

    // Initialize filters once from URL (one-way: URL -> state on mount)
    const [filters, setFilters] = useState<FilterState>(() => ({
      clienteId: searchParams.get("cliente") || "",
      maquinaId: searchParams.get("maquina") || "",
      status: searchParams.get("status") || "all",
      startDate: searchParams.get("inicio") ? parseISO(searchParams.get("inicio")!) : startOfMonth(new Date()),
      endDate: searchParams.get("fim") ? parseISO(searchParams.get("fim")!) : new Date(),
      operadorId: searchParams.get("operador") || "all",
    }));

    // Stable primitive key built from filters (avoid object identity issues in deps)
    const filtersKey = useMemo(() => JSON.stringify({
      c: filters.clienteId,
      m: filters.maquinaId,
      s: filters.status,
      o: filters.operadorId,
      i: filters.startDate?.toISOString() || "",
      f: filters.endDate?.toISOString() || "",
    }), [filters]);

    // Fetch data when filters change (page 0). Page is reset inside.
    useEffect(() => {
      let cancelled = false;
      const run = async () => {
        setLoading(true);
        setPage(0);

        let query = supabase
          .from("vw_leituras_com_anterior")
          .select("*", { count: 'exact' });

        if (filters.clienteId) query = query.eq("cliente_id", filters.clienteId);
        if (filters.maquinaId) query = query.eq("maquina_id", filters.maquinaId);
        if (filters.status !== "all") query = query.eq("status", filters.status as any);
        if (filters.operadorId !== "all") query = query.eq("usuario_id", filters.operadorId);
        if (filters.startDate) query = query.gte("data_leitura", filters.startDate.toISOString());
        if (filters.endDate) query = query.lte("data_leitura", endOfDay(filters.endDate).toISOString());

        const { data, count } = await query
          .order("data_leitura", { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (cancelled) return;

        const mapped = (data || []).map(l => {
          const variacao = l.data_leitura_previa ? calcularVariacao(
            { valor_faturado: Number(l.valor_faturado), pelucias_saidas: l.pelucias_saidas, data_leitura: l.data_leitura },
            {
              valor_faturado: Number(l.valor_faturado_previo),
              pelucias_saidas: l.pelucias_saidas_previa,
              data_leitura: l.data_leitura_previa,
              data_leitura_previa: l.data_leitura_pre_previa,
            }
          ) : null;
          return { ...l, variacao };
        });

        setItems(mapped);
        setHasMore(count ? mapped.length < count : false);
        setLoading(false);
      };
      run();
      return () => { cancelled = true; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtersKey]);

    // Sync filters -> URL (one-way: state -> URL). Compare via string to avoid loops.
    useEffect(() => {
      const params: Record<string, string> = {};
      if (filters.clienteId) params.cliente = filters.clienteId;
      if (filters.maquinaId) params.maquina = filters.maquinaId;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.operadorId !== "all") params.operador = filters.operadorId;
      if (filters.startDate) params.inicio = filters.startDate.toISOString();
      if (filters.endDate) params.fim = filters.endDate.toISOString();

      const current = new URLSearchParams(window.location.search);
      const currentObj: Record<string, string> = {};
      current.forEach((v, k) => { currentObj[k] = v; });
      if (JSON.stringify(params) !== JSON.stringify(currentObj)) {
        setSearchParams(params, { replace: true });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtersKey]);

    const loadMore = useCallback(async () => {
      setLoadingMore(true);
      const nextPage = page + 1;

      let query = supabase
        .from("vw_leituras_com_anterior")
        .select("*", { count: 'exact' });

      if (filters.clienteId) query = query.eq("cliente_id", filters.clienteId);
      if (filters.maquinaId) query = query.eq("maquina_id", filters.maquinaId);
      if (filters.status !== "all") query = query.eq("status", filters.status as any);
      if (filters.operadorId !== "all") query = query.eq("usuario_id", filters.operadorId);
      if (filters.startDate) query = query.gte("data_leitura", filters.startDate.toISOString());
      if (filters.endDate) query = query.lte("data_leitura", endOfDay(filters.endDate).toISOString());

      const { data, count } = await query
        .order("data_leitura", { ascending: false })
        .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);

      const mapped = (data || []).map(l => {
        const variacao = l.data_leitura_previa ? calcularVariacao(
          { valor_faturado: Number(l.valor_faturado), pelucias_saidas: l.pelucias_saidas, data_leitura: l.data_leitura },
          {
            valor_faturado: Number(l.valor_faturado_previo),
            pelucias_saidas: l.pelucias_saidas_previa,
            data_leitura: l.data_leitura_previa,
            data_leitura_previa: l.data_leitura_pre_previa,
          }
        ) : null;
        return { ...l, variacao };
      });

      setItems(prev => {
        const merged = [...prev, ...mapped];
        setHasMore(count ? merged.length < count : false);
        return merged;
      });
      setPage(nextPage);
      setLoadingMore(false);
    }, [filters, page]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Leituras"
        description="Histórico de coletas em campo"
         action={
           <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <div className="flex">
                  <Button 
                    onClick={() => {
                      const firstLeitura = itemsById.get(selectedIds[0]);
                      const sameCliente = selectedIds.every(id => itemsById.get(id)?.cliente_id === firstLeitura?.cliente_id);
                      if (!sameCliente) {
                        toast.error("Todas as leituras selecionadas devem ser do mesmo cliente.");
                        return;
                      }
                      navigate(`/leituras/consolidado?ids=${selectedIds.join(",")}`);
                    }} 
                    variant="outline" 
                    className="border-accent text-accent hover:bg-accent/10 rounded-r-none border-r-0"
                  >
                    <FileText className="h-4 w-4 mr-2" /> Relatório ({selectedIds.length})
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 rounded-l-none px-2 border-l-0">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/leituras/consolidado?ids=${selectedIds.join(",")}&format=a4`)}>
                        <FileText className="h-4 w-4 mr-2" /> PDF A4 (Padrão)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/leituras/consolidado?ids=${selectedIds.join(",")}&format=thermal`)}>
                        <Printer className="h-4 w-4 mr-2" /> PDF Bobina 57mm
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
             <Button onClick={() => navigate("/leituras/nova")} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent">
               <Plus className="h-4 w-4 mr-2" /> Nova
             </Button>
           </div>
         }
       />
 
       <ReadingFilters 
         filters={filters} 
         onFiltersChange={setFilters} 
         onClearFilters={() => setFilters({
           clienteId: "",
           maquinaId: "",
           status: "all",
           startDate: startOfMonth(new Date()),
           endDate: new Date(),
           operadorId: "all"
         })}
       />

       {loading && page === 0 ? (
         <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
       ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
           title="Nenhuma leitura encontrada"
           description={filters.status === 'all' ? "Faça a primeira leitura para começar." : "Nenhuma leitura com este status."}
          action={
             filters.status === 'all' ? (
              <Button onClick={() => navigate("/leituras/nova")} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" /> Nova leitura
              </Button>
            ) : undefined
          }
        />
      ) : (
         <div className="space-y-4">
           <div className="space-y-2">
            {items.map((l) => (
              <LeituraRow
                key={l.id}
                leitura={l}
                checked={selectedSet.has(l.id)}
                showPayButton={selectedIds.length === 0}
                showFinancials={showFinancials}
                onToggle={toggleSelect}
                onPay={handlePayItem}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => loadMore()} 
                disabled={loadingMore}
                className="w-full sm:w-auto"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Carregar mais
              </Button>
            </div>
          )}
        </div>
      )}

      {isAdmin && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="bg-background/95 backdrop-blur border-accent/20 shadow-2xl p-2 pl-4 flex items-center gap-4 border-2">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-accent uppercase tracking-wider">{selectedIds.length} selecionada(s)</span>
              {showFinancials && (
                <span className="text-sm font-semibold">Total: {formatBRL(totalComissao)}</span>
              )}
            </div>
            
            <div className="h-8 w-px bg-border" />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      disabled={!validation.valid}
                      onClick={() => {
                        setBatchSelection({ ids: selectedIds, clienteId: validation.clienteId! });
                        setPaymentDialogOpen(true);
                      }}
                      className="bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {selectedIds.length > 1 ? "Registrar pagamento em lote" : "Registrar pagamento"}
                    </Button>
                  </span>
                </TooltipTrigger>
                {validation.error && (
                  <TooltipContent side="top" className="bg-destructive text-destructive-foreground border-none">
                    <p className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {validation.error}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedIds([])}
              className="text-muted-foreground hover:text-foreground"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </Card>
        </div>
      )}

      {batchSelection && (
        <RegisterPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={(open) => {
            setPaymentDialogOpen(open);
            if (!open) setBatchSelection(null);
          }}
          onSuccess={() => {
            setSelectedIds([]);
            setBatchSelection(null);
            // Refresh items or just let it be
            window.location.reload();
          }}
          initialLeituraIds={batchSelection.ids}
          initialClienteId={batchSelection.clienteId}
        />
      )}
    </div>
  );
}
