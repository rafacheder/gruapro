 import { useEffect, useState } from "react";
 import { useNavigate, useParams, Link } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Card } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import PageHeader from "@/components/PageHeader";
 import { useAuth } from "@/contexts/AuthContext";
 import { ArrowLeft, FileDown, Loader2, Calendar, CreditCard, User, Info, ClipboardCheck, Trash2 } from "lucide-react";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from "@/components/ui/alert-dialog";
 import { logAudit } from "@/lib/audit";
 import { formatBRL, formatDateTime } from "@/lib/format";
 import { toast } from "sonner";
 
 export default function PagamentoDetalhe() {
   const { id } = useParams();
   const navigate = useNavigate();
   const { role } = useAuth();
   const [pagamento, setPagamento] = useState<any>(null);
   const [leituras, setLeituras] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [deleting, setDeleting] = useState(false);
   const handleDelete = async () => {
     setDeleting(true);
     try {
       // Obter leituras vinculadas antes de excluir
       const { data: links } = await supabase
         .from("pagamento_leituras")
         .select("leitura_id")
         .eq("pagamento_id", id);
 
       const leituraIds = links?.map(l => l.leitura_id) || [];
 
       // Voltar leituras para pendente
       if (leituraIds.length > 0) {
         const { error: updateError } = await supabase
           .from("leituras")
           .update({ status: "pendente" })
           .in("id", leituraIds);
         if (updateError) throw updateError;
       }
 
       const { error } = await supabase.from("pagamentos").delete().eq("id", id);
       if (error) throw error;
 
       await logAudit({
         acao: "DELETE",
         tabela: "pagamentos",
         registro_id: id,
         dados_antes: pagamento,
       });
 
       toast.success("Pagamento excluído com sucesso");
       navigate("/pagamentos", { replace: true });
     } catch (err) {
       console.error(err);
       toast.error("Erro ao excluir pagamento");
     } finally {
       setDeleting(false);
     }
   };
 
 
   useEffect(() => {
     const load = async () => {
       try {
         const { data: p, error } = await supabase
           .from("pagamentos")
           .select("*, clientes(nome_ponto), registered_by_profile:profiles!pagamentos_registrado_por_fkey(nome_completo)")
           .eq("id", id)
           .maybeSingle();
         if (error) throw error;
         setPagamento(p);
 
         if (p) {
           const { data: lData, error: lError } = await supabase
             .from("pagamento_leituras")
             .select("valor_aplicado, leituras(*, maquinas(codigo_identificacao))")
             .eq("pagamento_id", id);
           if (lError) throw lError;
           setLeituras(lData || []);
         }
       } catch (err) {
         console.error(err);
         toast.error("Erro ao carregar detalhes do pagamento");
       } finally {
         setLoading(false);
       }
     };
     load();
   }, [id]);
 
   const handleDownloadComprovante = async () => {
     if (!pagamento?.comprovante_url) return;
     const { data, error } = await supabase.storage.from("comprovantes-pagamento").download(pagamento.comprovante_url);
     if (error) {
       toast.error("Erro ao baixar comprovante");
       return;
     }
     const blobUrl = URL.createObjectURL(data);
     const a = document.createElement("a");
     a.href = blobUrl;
     a.download = `comprovante-${pagamento.comprovante_url}`;
     a.click();
   };
 
   if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
   if (!pagamento) return <div className="text-center py-12">Pagamento não encontrado</div>;
 
   const totalLeituras = leituras.reduce((acc, curr) => acc + Number(curr.valor_aplicado), 0);
   const diferenca = Number(pagamento.valor) - totalLeituras;
 
   return (
     <div>
       <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/pagamentos")}>
         <ArrowLeft className="h-4 w-4 mr-1" /> Pagamentos
       </Button>
       
       <PageHeader
         title={`Pagamento: ${pagamento.clientes?.nome_ponto}`}
         description={formatDateTime(pagamento.data_pagamento)}
         action={
           <div className="flex gap-2">
             {pagamento.comprovante_url && (
               <Button onClick={handleDownloadComprovante} variant="outline" className="border-accent text-accent hover:bg-accent/10">
                 <FileDown className="h-4 w-4 mr-2" /> Comprovante
               </Button>
             )}
             {(role === "master" || role === "admin") && (
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button variant="destructive" size="icon" disabled={deleting}>
                     {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
                     <AlertDialogDescription>
                       Esta ação não pode ser desfeita. Todas as leituras vinculadas voltarão para o status "pendente".
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>Cancelar</AlertDialogCancel>
                     <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                       Excluir
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
             )}
           </div>
         }
       />
 
       <div className="grid gap-4 md:grid-cols-2">
         <Card className="p-5 space-y-4">
           <h3 className="text-sm font-semibold flex items-center gap-2">
             <Info className="h-4 w-4 text-accent" /> Dados Gerais
           </h3>
           <div className="space-y-3">
             <div className="flex justify-between items-center text-sm">
               <span className="text-muted-foreground">Valor Total</span>
               <span className="text-xl font-bold text-accent">{formatBRL(pagamento.valor)}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-muted-foreground">Forma de Pagamento</span>
               <Badge variant="outline" className="capitalize">{pagamento.forma_pagamento}</Badge>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-muted-foreground">Registrado por</span>
               <span className="font-medium flex items-center gap-1">
                 <User className="h-3 w-3" />
                 {pagamento.registered_by_profile?.nome_completo || "—"}
               </span>
             </div>
             {pagamento.observacoes && (
               <div className="pt-2 border-t border-border">
                 <span className="text-xs text-muted-foreground block mb-1">Observações</span>
                 <p className="text-sm">{pagamento.observacoes}</p>
               </div>
             )}
           </div>
         </Card>
 
         <Card className="p-5 space-y-4">
           <h3 className="text-sm font-semibold flex items-center gap-2">
             <ClipboardCheck className="h-4 w-4 text-accent" /> Leituras Cobertas
           </h3>
           {leituras.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-4 italic">Este é um pagamento avulso sem leituras vinculadas.</p>
           ) : (
             <div className="space-y-2">
               {leituras.map((item) => (
                 <Link key={item.leituras.id} to={`/leituras/${item.leituras.id}`}>
                   <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/5 border border-transparent hover:border-accent/20 transition-all text-xs">
                     <div className="flex flex-col">
                       <span className="font-semibold">{formatDateTime(item.leituras.data_leitura)}</span>
                       <span className="text-muted-foreground">{item.leituras.maquinas?.codigo_identificacao}</span>
                     </div>
                     <span className="font-bold text-accent">{formatBRL(item.valor_aplicado)}</span>
                   </div>
                 </Link>
               ))}
               <div className="pt-3 border-t border-border mt-3">
                 <div className="flex justify-between items-center text-xs mb-1">
                   <span className="text-muted-foreground">Total das leituras:</span>
                   <span className="font-semibold">{formatBRL(totalLeituras)}</span>
                 </div>
                 {Math.abs(diferenca) > 0.01 && (
                   <div className={`p-2 rounded mt-2 text-[11px] ${diferenca > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-destructive/10 text-destructive'}`}>
                     {diferenca > 0 ? (
                       `Este pagamento cobre ${formatBRL(totalLeituras)} em comissões. Diferença: ${formatBRL(diferenca)} (adiantamento/crédito).`
                     ) : (
                       `Este pagamento é inferior à soma das leituras: ${formatBRL(Math.abs(diferenca))}`
                     )}
                   </div>
                 )}
               </div>
             </div>
           )}
         </Card>
       </div>
     </div>
   );
 }