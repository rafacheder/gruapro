 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Card } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Checkbox } from "@/components/ui/checkbox";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import PageHeader from "@/components/PageHeader";
 import { Loader2, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
 import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
 import { toast } from "sonner";
 
 export default function ReconciliacaoView() {
   const [loading, setLoading] = useState(true);
   const [pagamentos, setPagamentos] = useState<any[]>([]);
   const [selectedPagamento, setSelectedPagamento] = useState<any>(null);
   const [pendingLeituras, setPendingLeituras] = useState<any[]>([]);
   const [selectedLeituras, setSelectedLeituras] = useState<string[]>([]);
   const [saving, setSaving] = useState(false);
 
   useEffect(() => {
     loadUnlinkedPagamentos();
   }, []);
 
   async function loadUnlinkedPagamentos() {
     setLoading(true);
     try {
       // Fetch payments that don't have any links in pagamento_leituras
       const { data, error } = await supabase
         .from("pagamentos")
         .select("*, clientes(nome_ponto)")
         .order("data_pagamento", { ascending: false });
       
       if (error) throw error;
 
       const { data: links } = await supabase
         .from("pagamento_leituras")
         .select("pagamento_id");
       
       const linkedIds = new Set((links || []).map(l => l.pagamento_id));
       const unlinked = (data || []).filter(p => !linkedIds.has(p.id));
       
       setPagamentos(unlinked);
     } finally {
       setLoading(false);
     }
   }
 
   async function loadPendingLeituras(cid: string) {
     const { data, error } = await supabase
       .from("leituras")
       .select("*, maquinas(codigo_identificacao)")
       .eq("cliente_id", cid)
       .eq("status", "pendente")
       .order("data_leitura", { ascending: true });
     if (error) throw error;
     setPendingLeituras(data || []);
   }
 
   const handleSelectPagamento = async (p: any) => {
     setSelectedPagamento(p);
     setSelectedLeituras([]);
     await loadPendingLeituras(p.cliente_id);
   };
 
   const handleSave = async () => {
    if (!selectedPagamento || selectedLeituras.length === 0) return;
    
    const totalSelecionado = pendingLeituras
      .filter(l => selectedLeituras.includes(l.id))
      .reduce((acc, curr) => acc + Number(curr.valor_comissao), 0);

    if (Math.abs(totalSelecionado - Number(selectedPagamento.valor)) > 0.01) {
      if (!confirm(`O valor total selecionado (${formatBRL(totalSelecionado)}) é diferente do valor do pagamento (${formatBRL(selectedPagamento.valor)}). Deseja continuar?`)) {
        return;
      }
    }

    setSaving(true);
    try {
      const links = selectedLeituras.map(lid => {
        const leitura = pendingLeituras.find(l => l.id === lid);
        return {
          pagamento_id: selectedPagamento.id,
          leitura_id: lid,
          valor_aplicado: leitura?.valor_comissao || 0
        };
      });

      // Note: Ideally these should be in a single RPC transaction
      const { error: linkError } = await supabase
        .from("pagamento_leituras")
        .insert(links);
      
      if (linkError) throw linkError;

      const { error: statusError } = await supabase
        .from("leituras")
        .update({ status: "pago" })
        .in("id", selectedLeituras);
      
      if (statusError) {
        // Critical: Links were created but status didn't update
        console.error("Partial failure: links created but readings status not updated", statusError);
        toast.error("Vínculos criados, mas erro ao atualizar status das leituras. Por favor, verifique manualmente.");
      } else {
        toast.success("Vínculo criado com sucesso!");
      }

      setSelectedPagamento(null);
      await loadUnlinkedPagamentos();
    } catch (err) {
      console.error("Reconciliation error:", err);
      toast.error("Erro ao salvar reconciliação");
    } finally {
      setSaving(false);
    }
   };
 
   if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
 
   return (
     <div className="space-y-6">
       <PageHeader 
         title="Reconciliação de Pagamentos" 
         description="Vincular pagamentos antigos a leituras específicas" 
       />
 
       <div className="grid md:grid-cols-2 gap-6">
         <div className="space-y-4">
           <h3 className="font-semibold text-sm">Pagamentos sem vínculo ({pagamentos.length})</h3>
           <ScrollArea className="h-[600px] border rounded-md p-2">
             {pagamentos.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">Todos os pagamentos estão reconciliados!</div>
             ) : (
               <div className="space-y-2">
                 {pagamentos.map(p => (
                   <Card 
                     key={p.id} 
                     className={`p-3 cursor-pointer transition-all ${selectedPagamento?.id === p.id ? 'border-accent bg-accent/5' : 'hover:border-accent/50'}`}
                     onClick={() => handleSelectPagamento(p)}
                   >
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="text-sm font-bold">{p.clientes?.nome_ponto}</div>
                         <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           {formatDateTime(p.data_pagamento)}
                         </div>
                       </div>
                       <div className="text-sm font-bold text-accent">{formatBRL(p.valor)}</div>
                     </div>
                   </Card>
                 ))}
               </div>
             )}
           </ScrollArea>
         </div>
 
         <div className="space-y-4">
           <h3 className="font-semibold text-sm">Leituras Pendentes do Cliente</h3>
           {selectedPagamento ? (
             <Card className="p-4 space-y-4 h-full flex flex-col">
               <div className="bg-muted/50 p-3 rounded-md mb-2">
                 <div className="text-xs text-muted-foreground">Pagamento selecionado:</div>
                 <div className="font-bold">{formatBRL(selectedPagamento.valor)} em {formatDateTime(selectedPagamento.data_pagamento)}</div>
               </div>
 
               <ScrollArea className="flex-1 min-h-[400px]">
                 {pendingLeituras.length === 0 ? (
                   <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma leitura pendente para este cliente.</div>
                 ) : (
                   <div className="space-y-2">
                     {pendingLeituras.map(l => (
                       <div key={l.id} className="flex items-center space-x-2 p-2 hover:bg-accent/5 rounded-md border border-transparent hover:border-accent/10">
                         <Checkbox 
                           id={`lei-${l.id}`} 
                           checked={selectedLeituras.includes(l.id)}
                           onCheckedChange={(checked) => {
                             if (checked) setSelectedLeituras([...selectedLeituras, l.id]);
                             else setSelectedLeituras(selectedLeituras.filter(id => id !== l.id));
                           }}
                         />
                         <label htmlFor={`lei-${l.id}`} className="flex-1 text-xs cursor-pointer flex justify-between">
                          <span>{formatDate(l.data_leitura)} — {l.maquinas?.codigo_identificacao}</span>
                           <span className="font-bold text-accent">{formatBRL(l.valor_comissao)}</span>
                         </label>
                       </div>
                     ))}
                   </div>
                 )}
               </ScrollArea>
 
               <div className="pt-4 border-t space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-sm">Selecionado: <span className="font-bold">{formatBRL(pendingLeituras.filter(l => selectedLeituras.includes(l.id)).reduce((acc, curr) => acc + Number(curr.valor_comissao), 0))}</span></span>
                   <Button onClick={handleSave} disabled={saving || selectedLeituras.length === 0} className="bg-success hover:bg-success/90 text-success-foreground">
                     {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                     Confirmar Vínculos
                   </Button>
                 </div>
               </div>
             </Card>
           ) : (
             <div className="h-[600px] border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground space-y-2">
               <AlertCircle className="h-8 w-8 opacity-20" />
               <p className="text-sm">Selecione um pagamento à esquerda para reconciliar.</p>
             </div>
           )}
         </div>
       </div>
     </div>
   );
 }