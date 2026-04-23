import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Loader2, Download, Filter } from "lucide-react";
import { formatBRL, formatDate, formatDateTime, formatPercent } from "@/lib/format";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExtratosView() {
  const { role, nome } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nome_ponto: string }[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    loadClientes();
  }, []);

  async function loadClientes() {
    const { data } = await supabase.from("clientes").select("id, nome_ponto").order("nome_ponto");
    setClientes(data || []);
  }

  const handleApplyFilter = async () => {
    if (!selectedCliente) {
      toast.error("Selecione um cliente");
      return;
    }
    
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      // Cliente info
      const { data: cliente } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", selectedCliente)
        .single();

      // Leituras
      const { data: leituras } = await supabase
        .from("leituras")
        .select("*, maquinas(codigo_identificacao)")
        .eq("cliente_id", selectedCliente)
        .gte("data_leitura", startDate)
        .lte("data_leitura", endDate)
        .order("data_leitura");

      // Pagamentos
      const { data: pagamentos } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("cliente_id", selectedCliente)
        .gte("data_pagamento", startDate)
        .lte("data_pagamento", endDate)
        .order("data_pagamento");

      const totalFaturado = leituras?.reduce((acc, l) => acc + Number(l.valor_faturado), 0) || 0;
      const totalComissao = leituras?.reduce((acc, l) => acc + Number(l.valor_comissao), 0) || 0;
      const totalPago = pagamentos?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;
      const saldo = totalComissao - totalPago;

      setPreviewData({
        cliente,
        leituras,
        pagamentos,
        summary: {
          totalFaturado,
          totalComissao,
          totalPago,
          saldo
        },
        period: {
          month,
          year
        }
      });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados do extrato");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!previewData) return;

    const doc = new jsPDF();
    const { cliente, leituras, pagamentos, summary, period } = previewData;
    const docNumber = `EXT-${period.year}-${Date.now().toString().slice(-5)}`;
    const nowStr = formatDateTime(new Date());

    // Header
    doc.setFontSize(20);
    doc.text("GruaPro", 14, 22);
    doc.setFontSize(10);
    doc.text("Gestão de Máquinas de Pelúcia", 14, 28);
    
    doc.setFontSize(16);
    doc.text(`Extrato Mensal — ${String(period.month).padStart(2, '0')}/${period.year}`, 140, 22, { align: "right" });
    doc.setFontSize(10);
    doc.text(`Documento: ${docNumber}`, 140, 28, { align: "right" });

    // Client Info
    doc.line(14, 35, 196, 35);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Cliente", 14, 45);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Ponto: ${cliente.nome_ponto}`, 14, 52);
    doc.text(`Responsável: ${cliente.nome_responsavel}`, 14, 57);
    doc.text(`Endereço: ${cliente.rua}, ${cliente.numero} - ${cliente.bairro}, ${cliente.cidade}/${cliente.estado}`, 14, 62);
    doc.text(`Comissão: ${cliente.percentual_comissao}%`, 14, 67);

    // Leituras Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Leituras", 14, 80);
    
    const leiturasRows = leituras.map((l: any) => [
      formatDate(l.data_leitura),
      l.maquinas?.codigo_identificacao || "—",
      formatBRL(l.valor_faturado),
      l.pelucias_saidas,
      formatPercent(l.percentual_aplicado),
      formatBRL(l.valor_comissao)
    ]);

    autoTable(doc, {
      startY: 85,
      head: [["Data", "Máquina", "Faturado", "Pelúcias", "% Aplic.", "Comissão"]],
      body: leiturasRows,
      theme: "striped",
      headStyles: { fillColor: [139, 92, 246] }
    });

    // Pagamentos Table
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Pagamentos Efetuados", 14, finalY + 15);

    const pagamentosRows = pagamentos.map((p: any) => [
      formatDate(p.data_pagamento),
      formatBRL(p.valor),
      p.forma_pagamento,
      p.observacoes || "—"
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [["Data", "Valor", "Forma", "Observações"]],
      body: pagamentosRows,
      theme: "striped",
      headStyles: { fillColor: [139, 92, 246] }
    });

    // Summary
    const summaryY = (doc as any).lastAutoTable.finalY + 15;
    if (summaryY > 250) doc.addPage();
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Financeiro", 14, summaryY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Faturado:`, 14, summaryY + 10);
    doc.text(formatBRL(summary.totalFaturado), 70, summaryY + 10);
    
    doc.text(`Total Comissão Gerada:`, 14, summaryY + 17);
    doc.text(formatBRL(summary.totalComissao), 70, summaryY + 17);
    
    doc.text(`Total Pago ao Cliente:`, 14, summaryY + 24);
    doc.text(formatBRL(summary.totalPago), 70, summaryY + 24);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Saldo a Pagar/Receber:`, 14, summaryY + 34);
    doc.text(formatBRL(summary.saldo), 70, summaryY + 34);

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Documento gerado em ${nowStr} (America/Sao_Paulo) por ${nome || "Usuário"} — ${docNumber} — Página ${i} de ${pageCount}`,
        105,
        285,
        { align: "center" }
      );
    }

    doc.save(`extrato-${cliente.nome_ponto.replace(/\s+/g, '-').toLowerCase()}-${period.month}-${period.year}.pdf`);

    // Audit log
    await logAudit({
      acao: "GENERATE_EXTRATO",
      tabela: "pagamentos", // technically it's a report but we use this table as reference
      registro_id: cliente.id,
      dados_depois: {
        cliente_id: cliente.id,
        periodo: `${period.month}/${period.year}`,
        documento: docNumber
      }
    });
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: d.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d)
    };
  });

  return (
    <div>
      <PageHeader
        title="Extratos"
        description="Geração de extratos mensais para acerto com clientes"
      />

      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_ponto}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[200px] space-y-2">
            <label className="text-sm font-medium">Mês/Ano</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleApplyFilter} disabled={loading} className="w-full md:w-auto bg-accent hover:bg-accent/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
            Aplicar Filtros
          </Button>
        </div>
      </Card>

      {previewData ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{previewData.cliente.nome_ponto}</h2>
              <p className="text-muted-foreground">{previewData.cliente.nome_responsavel} • {previewData.cliente.cidade}/{previewData.cliente.estado}</p>
            </div>
            <Button onClick={generatePDF} className="bg-green-600 hover:bg-green-700 text-white">
              <Download className="h-4 w-4 mr-2" /> Baixar Extrato em PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Faturado</p>
              <p className="text-xl font-bold">{formatBRL(previewData.summary.totalFaturado)}</p>
            </Card>
            <Card className="p-4 bg-muted/50 border-accent/20">
              <p className="text-xs text-accent uppercase font-bold">Comissão Total</p>
              <p className="text-xl font-bold text-accent">{formatBRL(previewData.summary.totalComissao)}</p>
            </Card>
            <Card className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Pago</p>
              <p className="text-xl font-bold">{formatBRL(previewData.summary.totalPago)}</p>
            </Card>
            <Card className="p-4 bg-accent text-accent-foreground">
              <p className="text-xs uppercase font-bold opacity-80">Saldo</p>
              <p className="text-xl font-bold">{formatBRL(previewData.summary.saldo)}</p>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Leituras do Período</h3>
            <div className="border rounded-md bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Máquina</TableHead>
                    <TableHead>Faturado</TableHead>
                    <TableHead className="hidden md:table-cell">Pelúcias</TableHead>
                    <TableHead className="hidden md:table-cell">% Aplic.</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.leituras.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma leitura neste período</TableCell></TableRow>
                  ) : previewData.leituras.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell>{formatDate(l.data_leitura)}</TableCell>
                      <TableCell>{l.maquinas?.codigo_identificacao || "—"}</TableCell>
                      <TableCell>{formatBRL(l.valor_faturado)}</TableCell>
                      <TableCell className="hidden md:table-cell">{l.pelucias_saidas}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatPercent(l.percentual_aplicado)}</TableCell>
                      <TableCell className="text-right font-medium text-accent">{formatBRL(l.valor_comissao)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5" /> Pagamentos do Período</h3>
            <div className="border rounded-md bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.pagamentos.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum pagamento neste período</TableCell></TableRow>
                  ) : previewData.pagamentos.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.data_pagamento)}</TableCell>
                      <TableCell className="capitalize">{p.forma_pagamento}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{p.observacoes || "—"}</TableCell>
                      <TableCell className="text-right font-medium">{formatBRL(p.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-lg border border-dashed border-border">
          <FileText className="h-12 w-12 mb-4 opacity-20" />
          <p>Selecione um cliente e período para visualizar o extrato.</p>
        </div>
      )}
    </div>
  );
}
