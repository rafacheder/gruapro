import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { useAuth, canSeeFinancials } from "@/contexts/AuthContext";
import { ArrowLeft, FileDown, Loader2, TrendingDown, TrendingUp, Minus, AlertCircle, History } from "lucide-react";
import { formatBRL, formatDateTime, formatPercent } from "@/lib/format";
import { calcularVariacao, type VariacaoLeitura } from "@/utils/reading-calculations";
import { gerarPdfLeitura } from "@/lib/pdf";
import { logAudit } from "@/lib/audit";
import { toast } from "sonner";

export default function LeituraDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, nome } = useAuth();
  const showFinancials = canSeeFinancials(role);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leitura, setLeitura] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fotos, setFotos] = useState<any[]>([]);
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

  const handlePdf = async () => {
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
      });
      await logAudit({
        acao: "GENERATE_PDF_LEITURA",
        tabela: "leituras",
        registro_id: leitura.id,
        dados_depois: { docId, hash },
      });
      toast.success("PDF gerado");
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
      <PageHeader
        title={leitura.clientes?.nome_ponto}
        description={`${leitura.maquinas?.codigo_identificacao} • ${formatDateTime(leitura.data_leitura)}`}
        action={
          <Button onClick={handlePdf} disabled={generating} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent">
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            PDF
          </Button>
        }
      />

      <Card className="p-5 bg-card mb-4 space-y-3">
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
        <div className="flex items-center justify-between pt-2">
          <Badge variant={leitura.status === "pago" ? "default" : "secondary"}>
            {leitura.status === "pendente" ? "Pendente" : leitura.status}
          </Badge>
        </div>
      </Card>

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