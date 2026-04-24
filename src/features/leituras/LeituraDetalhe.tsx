import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { useAuth, canSeeFinancials } from "@/contexts/AuthContext";
 import {
   ArrowLeft,
   FileDown,
   Printer,
   Pencil,
   Loader2, 
   TrendingDown, 
   TrendingUp, 
   Minus, 
   AlertCircle, 
   History, 
   CheckCircle2,
   CreditCard,
   ExternalLink
 } from "lucide-react";
 import { formatBRL, formatDateTime, formatPercent } from "@/lib/format";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
import { calcularVariacao, type VariacaoLeitura } from "@/utils/reading-calculations";
import { gerarPdfLeitura } from "@/lib/pdf";
import { logAudit } from "@/lib/audit";
import { toast } from "sonner";

 import RegisterPaymentDialog from "../pagamentos/RegisterPaymentDialog";
 
export default function LeituraDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, nome, user } = useAuth();
  const showFinancials = canSeeFinancials(role);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leitura, setLeitura] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const [fotos, setFotos] = useState<any[]>([]);
   const [pagamentoInfo, setPagamentoInfo] = useState<any>(null);
   const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [variacaoResult, setVariacaoResult] = useState<VariacaoLeitura | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async (retryCount = 0) => {
      let isRetrying = false;
      try {
        const { data: l, error } = await supabase
          .from("vw_leituras_com_anterior")
          .select("*, clientes(nome_ponto, nome_responsavel, cidade, estado), maquinas(codigo_identificacao, modelo), profiles(nome_completo)")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;

        // If not found and we haven't retried yet, wait a bit and try again
        // This handles potential race conditions after redirect from NovaLeitura
        if (!l && retryCount < 2) {
          isRetrying = true;
          setTimeout(() => load(retryCount + 1), 1000);
          return;
        }

         const { data: f } = await supabase.from("leitura_fotos").select("*").eq("leitura_id", id).order("ordem");
 
         // Load payment info if paid
         if (l && l.status === "pago") {
           const { data: pLink } = await supabase
             .from("pagamento_leituras")
             .select("pagamento_id, pagamentos(*)")
             .eq("leitura_id", id)
             .maybeSingle();
           if (pLink) {
             setPagamentoInfo(pLink.pagamentos);
           }
         }
        
        setLeitura(l);
        setFotos(f || []);
        
        if (l && l.data_leitura_previa) {
          const v = calcularVariacao(
            { valor_faturado: Number(l.valor_faturado), pelucias_saidas: l.pelucias_saidas, data_leitura: l.data_leitura },
            { 
              valor_faturado: Number(l.valor_faturado_previo), 
              pelucias_saidas: l.pelucias_saidas_previa, 
              data_leitura: l.data_leitura_previa,
              data_leitura_previa: l.data_leitura_pre_previa
            }
          );
          setVariacaoResult(v);
        } else {
          setVariacaoResult(null);
        }
      } catch (err) {
        console.error("Erro ao carregar leitura:", id, err);
        toast.error("Erro ao carregar dados da leitura");
      } finally {
        if (!isRetrying) {
          setLoading(false);
        }
      }
    };
     
     if (id) {
       load();
     } else {
       setLoading(false);
     }
   }, [id]);

   const handlePdf = async (type: 'a4' | 'thermal' = 'a4') => {
     if (!leitura) return;
     setGenerating(true);
     try {
       const { docId, hash } = await gerarPdfLeitura({
         id: leitura.id,
         data_leitura: leitura.data_leitura,
         valor_faturado: Number(leitura.valor_faturado),
         pelucias_saidas: leitura.pelucias_saidas,
         valor_comissao: Number(leitura.valor_comissao),
         valor_liquido: Number(leitura.valor_liquido),
         percentual_aplicado: Number(leitura.percentual_aplicado),
         observacoes: leitura.observacoes,
         cliente: leitura.clientes,
         maquina: leitura.maquinas,
         fotos: fotos.map((f) => f.foto_url),
         usuario_nome: nome || "Usuário",
          contador_entrada_atual: leitura.contador_entrada_atual,
          contador_saida_atual: leitura.contador_saida_atual,
          contador_entrada_anterior: leitura.contador_entrada_anterior,
          contador_saida_anterior: leitura.contador_saida_anterior,
       }, type);
       await logAudit({
         acao: type === 'a4' ? "GENERATE_PDF_LEITURA" : "GENERATE_PDF_LEITURA_THERMAL",
         tabela: "leituras",
         registro_id: leitura.id,
         dados_depois: { docId, hash },
       });
       toast.success(type === 'a4' ? "PDF A4 gerado" : "PDF Térmico gerado");
     } catch (err) {
       console.error(err);
       toast.error("Erro ao gerar PDF");
     } finally {
       setGenerating(false);
     }
   };

   if (loading) {
     return (
       <div className="flex flex-col items-center justify-center py-12 space-y-4">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
         <p className="text-sm text-muted-foreground">Carregando detalhes da leitura...</p>
       </div>
     );
   }
 
   if (!leitura) {
     return (
       <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
         <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
           <ArrowLeft className="h-8 w-8 text-muted-foreground" />
         </div>
         <div className="space-y-1">
           <h3 className="text-lg font-semibold">Leitura não encontrada</h3>
           <p className="text-sm text-muted-foreground">A leitura pode ter sido removida ou você não tem permissão para vê-la.</p>
         </div>
         <Button variant="outline" onClick={() => navigate("/leituras")}>
           Voltar para a lista
         </Button>
       </div>
     );
   }

  const valorAtual = Number(leitura.valor_faturado);

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/leituras")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Leituras
      </Button>
       <div className="flex flex-col gap-4">
         <PageHeader
           title={leitura.clientes?.nome_ponto}
           description={`${leitura.maquinas?.codigo_identificacao} • ${formatDateTime(leitura.data_leitura)}`}
            action={
              <div className="flex gap-2">
                {(leitura.usuario_id === user?.id || role === 'admin' || role === 'master') && (
                  <Button variant="outline" size="icon" onClick={() => navigate(`/leituras/${id}/editar`)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {leitura.status === 'pendente' && (
                  <Button 
                    onClick={() => setPaymentDialogOpen(true)}
                    variant="outline"
                    className="border-success text-success hover:bg-success hover:text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como pago
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={generating} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent">
                      {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handlePdf('a4')}>
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF (A4)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePdf('thermal')}>
                      <Printer className="h-4 w-4 mr-2" />
                      Bobina Térmica (57mm)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
         />

       <Card className="p-5 bg-card mb-4 space-y-3 relative overflow-hidden">
         <div className={`absolute left-0 top-0 bottom-0 w-1 ${
           leitura.status === 'pago' ? 'bg-success' : 
           leitura.status === 'pendente' ? 'bg-warning' : 
           'bg-muted'
         }`} />
         
         {leitura.contador_entrada_atual !== null && (
            <div className="border-b border-border/50 pb-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Contadores</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Valor/Cred: {formatBRL(leitura.valor_por_credito)}</div>
              </div>
              <div className="grid grid-cols-3 gap-y-1 text-[11px] font-mono">
                <div className="text-muted-foreground font-sans uppercase text-[9px] font-bold">Ref.</div>
                <div className="text-right font-bold pr-4">ENTRADA</div>
                <div className="text-right font-bold pr-2">SAÍDA</div>
                
                <div className="text-muted-foreground font-sans">ANTERIOR</div>
                <div className="text-right pr-4">{leitura.contador_entrada_anterior ?? 0}</div>
                <div className="text-right pr-2">{leitura.contador_saida_anterior ?? 0}</div>
                
                <div className="text-muted-foreground font-sans">ATUAL</div>
                <div className="text-right pr-4">{leitura.contador_entrada_atual ?? 0}</div>
                <div className="text-right pr-2">{leitura.contador_saida_atual ?? 0}</div>
                
                <div className="text-accent font-sans font-bold pt-1">DIFERENÇA</div>
                <div className="text-right font-bold text-accent pr-4 pt-1">
                  {leitura.contador_entrada_atual - leitura.contador_entrada_anterior}
                </div>
                <div className="text-right font-bold text-accent pr-2 pt-1">
                  {leitura.contador_saida_atual - leitura.contador_saida_anterior}
                </div>
              </div>
            </div>
         )}
         <div className="flex items-center justify-between">
           <span className="text-muted-foreground text-sm">Valor faturado</span>
           <span className="text-xl font-bold">{formatBRL(valorAtual)}</span>
         </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Pelúcias saídas</span>
          <span className="font-semibold">{leitura.pelucias_saidas}</span>
        </div>
        {showFinancials && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Comissão ({leitura.percentual_aplicado}%)</span>
              <span className="font-semibold text-accent">{formatBRL(Number(leitura.valor_comissao))}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-medium">Líquido p/ empresa</span>
              <span className="font-bold">{formatBRL(Number(leitura.valor_liquido))}</span>
            </div>
          </>
        )}
         <div className="flex flex-col gap-3 pt-2">
           <div className="flex items-center justify-between">
             <Badge 
               className={`${
                 leitura.status === 'pago' ? 'bg-success hover:bg-success/90' : 
                 leitura.status === 'pendente' ? 'bg-warning hover:bg-warning/90' : 
                 ''
               }`}
             >
               {leitura.status === "pendente" ? "Pendente" : (
                 <span className="flex items-center gap-1">
                   {leitura.status === "pago" && <CheckCircle2 className="h-3 w-3" />}
                   {leitura.status}
                 </span>
               )}
             </Badge>
           </div>
 
           {leitura.status === 'pago' && pagamentoInfo && (
             <div className="bg-success/5 border border-success/20 rounded-lg p-3 mt-1">
               <div className="flex items-center gap-2 text-success text-sm font-medium mb-1">
                 <CheckCircle2 className="h-4 w-4" />
                 Pago em {formatDateTime(pagamentoInfo.data_pagamento)} via {pagamentoInfo.forma_pagamento}
               </div>
               <Link 
                 to={`/pagamentos/${pagamentoInfo.id}`}
                 className="text-xs text-accent hover:underline flex items-center gap-1"
               >
                 <ExternalLink className="h-3 w-3" />
                 Ver detalhes do pagamento
               </Link>
             </div>
           )}
         </div>
      </Card>
       </div>
 
       <RegisterPaymentDialog 
         open={paymentDialogOpen}
         onOpenChange={setPaymentDialogOpen}
         onSuccess={() => {
           window.location.reload();
         }}
          initialLeituraIds={[leitura.id]}
         initialClienteId={leitura.cliente_id}
       />

      {variacaoResult && (
        <Card className="p-5 bg-card mb-4 border-l-4 border-l-accent">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-accent" />
              Comparativo com leitura anterior
            </h3>
            {leitura.leitura_previa_id && (
               <Link 
                 to={`/leituras/${leitura.leitura_previa_id}`} 
                 className="text-xs text-accent hover:underline flex items-center gap-1"
               >
                 Ver leitura anterior
               </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Faturamento</div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold flex items-center gap-1 ${
                  variacaoResult.nivelAlerta === 'critico' ? 'text-destructive' : 
                  variacaoResult.nivelAlerta === 'atencao' ? 'text-warning' : 
                  variacaoResult.variacaoDiaria > 5 ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {variacaoResult.variacaoDiaria > 5 ? <TrendingUp className="h-3 w-3" /> : 
                   variacaoResult.variacaoDiaria < -5 ? (variacaoResult.nivelAlerta === 'critico' ? <AlertCircle className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />) : 
                   <Minus className="h-3 w-3" />}
                  {formatPercent(variacaoResult.variacaoDiaria)}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">(diário)</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pelúcias</div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold flex items-center gap-1 ${
                  variacaoResult.variacaoPelucias > 0 ? 'text-success' : 
                  variacaoResult.variacaoPelucias < 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {variacaoResult.variacaoPelucias > 0 ? <TrendingUp className="h-3 w-3" /> : 
                   variacaoResult.variacaoPelucias < 0 ? <TrendingDown className="h-3 w-3" /> : 
                   <Minus className="h-3 w-3" />}
                  {formatPercent(variacaoResult.variacaoPelucias)}
                </span>
              </div>
            </div>
            
            <div className="col-span-2 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              Intervalo entre leituras: {variacaoResult.diasEntreLeituras} dias
            </div>
          </div>
        </Card>
      )}

      {leitura.observacoes && (
        <Card className="p-5 bg-card mb-4">
          <div className="text-sm font-medium mb-1">Observações</div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{leitura.observacoes}</p>
        </Card>
      )}

      {fotos.length > 0 && (
        <Card className="p-5 bg-card mb-4">
          <div className="text-sm font-medium mb-3">Fotos ({fotos.length})</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {fotos.map((f) => (
              <a key={f.id} href={f.foto_url} target="_blank" rel="noreferrer" className="block aspect-square rounded-md overflow-hidden border border-border hover:border-accent">
                <img src={f.foto_url} alt={`Foto ${f.ordem}`} className="w-full h-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5 bg-card text-xs text-muted-foreground">
        Registrada por <span className="text-foreground font-medium">{leitura.profiles?.nome_completo || "—"}</span>
        <br />
        Cliente: <Link to={`/clientes/${leitura.cliente_id}`} className="text-accent hover:underline">{leitura.clientes?.nome_ponto}</Link>
        {" • "}
        Máquina: <Link to={`/maquinas/${leitura.maquina_id}`} className="text-accent hover:underline">{leitura.maquinas?.codigo_identificacao}</Link>
      </Card>
    </div>
  );
}