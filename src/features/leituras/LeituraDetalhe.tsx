import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { useAuth, canSeeFinancials } from "@/contexts/AuthContext";
import { ArrowLeft, FileDown, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { formatBRL, formatDateTime } from "@/lib/format";
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
  const [anterior, setAnterior] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async (retryCount = 0) => {
      let isRetrying = false;
      try {
        const { data: l, error } = await supabase
          .from("leituras")
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
        
        if (l) {
          const { data: ant } = await supabase
            .from("leituras")
            .select("valor_faturado")
            .eq("maquina_id", l.maquina_id)
            .lt("data_leitura", l.data_leitura)
            .order("data_leitura", { ascending: false })
            .limit(1)
            .maybeSingle();
          setAnterior(ant ? Number(ant.valor_faturado) : null);
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
  const variacao = anterior ? ((valorAtual - anterior) / anterior) * 100 : null;
  const variacaoNeg = variacao !== null && variacao < -30;

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
            {leitura.status === "pendente_pagamento" ? "Pendente" : leitura.status}
          </Badge>
          {variacao !== null && (
            <div className={`flex items-center gap-1 text-xs ${variacaoNeg ? "text-destructive" : variacao > 0 ? "text-success" : "text-muted-foreground"}`}>
              {variacao > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {variacao > 0 ? "+" : ""}{variacao.toFixed(1)}% vs leitura anterior
            </div>
          )}
        </div>
      </Card>

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