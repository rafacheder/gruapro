 import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { formatBRL, formatDateTime } from "@/lib/format";
 import { gerarPdfConsolidado, gerarPdfConsolidadoTermico, type ConsolidatedLeitura } from "@/lib/pdf";
 import { ArrowLeft, Download, Loader2, FileText, CheckCircle2, Printer, ChevronDown } from "lucide-react";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { logAudit } from "@/lib/audit";
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

   const getFormattedLeituras = (): ConsolidatedLeitura[] => {
     return leituras.map(l => ({
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
   };
 
   const handleDownloadA4 = async () => {
     if (!cliente || leituras.length === 0) return;
     const formattedLeituras = getFormattedLeituras();
     await gerarPdfConsolidado(
       cliente.nome_ponto,
       leituras[0].data_leitura,
       user?.user_metadata?.full_name || user?.email || "Operador",
       formattedLeituras
     );
     await logAudit({ acao: "GENERATE_REPORT_A4", tabela: "leituras", registro_id: ids[0], dados_depois: { ids } });
     toast.success("PDF A4 gerado!");
   };
 
   const handleDownloadThermal = async () => {
     if (!cliente || leituras.length === 0) return;
     const formattedLeituras = getFormattedLeituras();
     await gerarPdfConsolidadoTermico(
       cliente.nome_ponto,
       leituras[0].data_leitura,
       user?.user_metadata?.full_name || user?.email || "Operador",
       formattedLeituras
     );
     await logAudit({ acao: "GENERATE_REPORT_THERMAL", tabela: "leituras", registro_id: ids[0], dados_depois: { ids } });
     toast.success("PDF Bobina 57mm gerado!");
   };
 
   const handlePrint = () => {
     window.print();
   };

   const { totalGeral, totalComissao, totalLiquido } = useMemo(() => {
     return leituras.reduce((acc, l) => ({
       totalGeral: acc.totalGeral + Number(l.valor_faturado),
       totalComissao: acc.totalComissao + Number(l.valor_comissao),
       totalLiquido: acc.totalLiquido + Number(l.valor_liquido)
     }), { totalGeral: 0, totalComissao: 0, totalLiquido: 0 });
   }, [leituras]);
 
   if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;

   const { totalEntrada, totalSaida } = useMemo(() => {
     return leituras.reduce((acc, l) => ({
       totalEntrada: acc.totalEntrada + ((l.contador_entrada_atual ?? 0) - (l.contador_entrada_anterior ?? 0)),
       totalSaida: acc.totalSaida + ((l.contador_saida_atual ?? 0) - (l.contador_saida_anterior ?? 0)),
     }), { totalEntrada: 0, totalSaida: 0 });
   }, [leituras]);
 
   return (
     <div className="max-w-4xl mx-auto px-4 pb-12">
       <style>
         {`
           @media print {
             @page {
               size: 48mm auto;
               margin: 0;
             }
             body * {
               visibility: hidden;
             }
             #thermal-print-area, #thermal-print-area * {
               visibility: visible;
             }
             #thermal-print-area {
               position: absolute;
               left: 0;
               top: 0;
               width: 48mm;
               padding: 2mm 4.5mm;
               font-family: 'Courier New', Courier, monospace;
               font-size: 8pt;
               color: black !important;
               background: white !important;
             }
             .no-print {
               display: none !important;
             }
           }
           #thermal-print-area {
             display: none;
           }
         `}
       </style>
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/leituras")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>
      
       <div className="no-print">
         <PageHeader 
           title="Relatório Consolidado" 
           description={cliente?.nome_ponto}
           action={
             <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={handlePrint} className="hidden md:flex">
                 <Printer className="h-4 w-4 mr-2" /> Imprimir
               </Button>
               <div className="flex">
                 <Button onClick={handleDownloadA4} className="bg-accent hover:bg-accent/90 rounded-r-none border-r border-accent-foreground/10">
                   <Download className="h-4 w-4 mr-2" /> Baixar PDF
                 </Button>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button className="bg-accent hover:bg-accent/90 rounded-l-none px-2 h-10">
                       <ChevronDown className="h-4 w-4" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={handleDownloadA4}>
                       <FileText className="h-4 w-4 mr-2" /> PDF A4 (Padrão)
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={handleDownloadThermal}>
                       <Printer className="h-4 w-4 mr-2" /> PDF Bobina 57mm
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
               </div>
             </div>
           }
         />
       </div>
 
       {/* Thermal Print Area (Hidden in UI, visible during print) */}
       <div id="thermal-print-area">
         <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', marginBottom: '2mm' }}>GRUAPRO</div>
         <div style={{ textAlign: 'center', marginBottom: '2mm' }}>--------------</div>
         <div>Cliente: {cliente?.nome_ponto}</div>
         <div>Data: {formatDateTime(leituras[0]?.data_leitura).split(' ')[0]}</div>
         <div>Operador: {user?.user_metadata?.full_name || user?.email || "Operador"}</div>
         <div style={{ textAlign: 'center', margin: '3mm 0', fontWeight: 'bold' }}>
           ================<br />
           LEITURAS<br />
           ================
         </div>
         {leituras.map((l, i) => (
           <div key={l.id} style={{ marginBottom: '4mm' }}>
             <div style={{ fontWeight: 'bold' }}>{i + 1} - {l.maquinas?.codigo_identificacao}</div>
             <div style={{ whiteSpace: 'pre' }}>  ANT  {String(l.contador_entrada_anterior ?? 0).padStart(5)} {String(l.contador_saida_anterior ?? 0).padStart(5)}</div>
             <div style={{ whiteSpace: 'pre' }}>  ATU  {String(l.contador_entrada_atual ?? 0).padStart(5)} {String(l.contador_saida_atual ?? 0).padStart(5)}</div>
             <div style={{ whiteSpace: 'pre' }}>  DIF  {String((l.contador_entrada_atual ?? 0) - (l.contador_entrada_anterior ?? 0)).padStart(5)} {String((l.contador_saida_atual ?? 0) - (l.contador_saida_anterior ?? 0)).padStart(5)}</div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>  Total</span>
               <span>{formatBRL(l.valor_faturado)}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>  Comiss.</span>
               <span>{formatBRL(l.valor_comissao)}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>  Receber</span>
               <span>{formatBRL(l.valor_liquido)}</span>
             </div>
             <div style={{ textAlign: 'center', marginTop: '2mm' }}>----------------</div>
           </div>
         ))}
         <div style={{ textAlign: 'center', margin: '3mm 0', fontWeight: 'bold' }}>
           ================<br />
           TOTAIS<br />
           ================
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
           <span>Entrada:</span>
           <span>{totalEntrada}</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
           <span>Saida:</span>
           <span>{totalSaida}</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
           <span>Geral:</span>
           <span>{formatBRL(totalGeral)}</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
           <span>Comiss.:</span>
           <span>{formatBRL(totalComissao)}</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
           <span>Saldo:</span>
           <span>{formatBRL(totalLiquido)}</span>
         </div>
         <div style={{ textAlign: 'center', margin: '3mm 0' }}>----------------</div>
         <div style={{ fontSize: '7pt' }}>
           Gerado: {formatDateTime(new Date())}<br />
           Por: {user?.user_metadata?.full_name || user?.email || "Operador"}<br />
           Doc: REL-{new Date().getFullYear()}-...<br />
           Sistema v2.0.0
         </div>
       </div>
 
       <div className="grid gap-6 no-print">

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
