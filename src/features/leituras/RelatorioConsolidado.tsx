import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { formatBRL, formatDateTime } from "@/lib/format";
import { gerarPdfConsolidado, type ConsolidatedLeitura } from "@/lib/pdf";
import { ArrowLeft, Download, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function RelatorioConsolidado() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ids = searchParams.get("ids")?.split(",") || [];
  const [loading, setLoading] = useState(true);
  const [leituras, setLeituras] = useState<any[]>([]);
  const [cliente, setCliente] = useState<any>(null);

  useEffect(() => {
    if (ids.length === 0) {
      navigate("/leituras");
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("leituras")
        .select("          id,           data_leitura,           valor_faturado,           valor_comissao,           valor_liquido,           pelucias_saidas,           contador_entrada_atual,           contador_saida_atual,           contador_entrada_anterior,           contador_saida_anterior,           valor_por_credito,           maquinas(codigo_identificacao, modelo),           clientes(nome_ponto)         ")
        .in("id", ids)
        .order("data_leitura", { ascending: true });

      if (error) {
        toast.error("Erro ao carregar leituras");
        console.error(error);
      } else {
        setLeituras(data || []);
        if (data && data.length > 0) {
          setCliente(data[0].clientes);
        }
      }
      setLoading(false);
    };
    load();
  }, [searchParams]);

  const handleDownload = async () => {
    if (!cliente || leituras.length === 0) return;
    
    const formattedLeituras: ConsolidatedLeitura[] = leituras.map(l => ({
      id: l.id,
      data_leitura: l.data_leitura,
      maquina_codigo: l.maquinas?.codigo_identificacao || "—",
      maquina_modelo: l.maquinas?.modelo,
      contador_entrada_atual: l.contador_entrada_atual,
      contador_saida_atual: l.contador_saida_atual,
      contador_entrada_anterior: l.contador_entrada_anterior,
      contador_saida_anterior: l.contador_saida_anterior,
      valor_por_credito: l.valor_por_credito,
      valor_faturado: Number(l.valor_faturado),
      valor_comissao: Number(l.valor_comissao),
      valor_liquido: Number(l.valor_liquido),
      pelucias_saidas: Number(l.pelucias_saidas),
    }));

    await gerarPdfConsolidado(
      cliente.nome_ponto,
      leituras[0].data_leitura,
      user?.user_metadata?.full_name || user?.email || "Operador",
      formattedLeituras
    );
    toast.success("PDF gerado com sucesso!");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;

  const totalGeral = leituras.reduce((acc, l) => acc + Number(l.valor_faturado), 0);
  const totalComissao = leituras.reduce((acc, l) => acc + Number(l.valor_comissao), 0);
  const totalLiquido = leituras.reduce((acc, l) => acc + Number(l.valor_liquido), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/leituras")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>
      
      <PageHeader 
        title="Relatório Consolidado" 
        description={cliente?.nome_ponto}
        action={
          <Button onClick={handleDownload} className="bg-accent hover:bg-accent/90">
            <Download className="h-4 w-4 mr-2" /> Baixar PDF
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 text-success font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Coleta finalizada com sucesso!
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <div className="text-[10px] uppercase text-muted-foreground font-bold">Máquinas</div>
                <div className="text-lg font-bold">{leituras.length}</div>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <div className="text-[10px] uppercase text-muted-foreground font-bold">Total Geral</div>
                <div className="text-lg font-bold">{formatBRL(totalGeral)}</div>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <div className="text-[10px] uppercase text-muted-foreground font-bold">Comissões</div>
                <div className="text-lg font-bold text-accent">{formatBRL(totalComissao)}</div>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <div className="text-[10px] uppercase text-muted-foreground font-bold">Saldo Empresa</div>
                <div className="text-lg font-bold text-success">{formatBRL(totalLiquido)}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Detalhamento das máquinas
              </h4>
              <div className="space-y-2">
                {leituras.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-2 hover:bg-secondary/10 rounded text-sm border-b border-border/50 last:border-0">
                    <div>
                      <span className="font-medium">{l.maquinas?.codigo_identificacao}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({l.contador_entrada_atual - l.contador_entrada_anterior} créditos)
                      </span>
                    </div>
                    <div className="font-semibold">{formatBRL(l.valor_faturado)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => navigate("/leituras")}>
            Ir para lista de leituras
          </Button>
        </div>
      </div>
    </div>
  );
}
