 export interface ConsolidatedLeitura {
   id: string;
   data_leitura: string;
   maquina_codigo: string;
   maquina_modelo?: string | null;
   contador_entrada_atual?: number | null;
   contador_saida_atual?: number | null;
   contador_entrada_anterior?: number | null;
   contador_saida_anterior?: number | null;
   valor_por_credito?: number | null;
   valor_faturado: number;
   valor_comissao: number;
   valor_liquido: number;
   pelucias_saidas: number;
 }
 
 export async function gerarPdfConsolidado(
   clienteNome: string,
   data: string,
   operadorNome: string,
   leituras: ConsolidatedLeitura[]
 ) {
   const doc = new jsPDF();
   const now = new Date();
   const docId = `REL-${now.getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
 
   // Cabeçalho
   doc.setFontSize(14);
   doc.setFont("helvetica", "bold");
   doc.text("Resumo detalhado", 14, 15);
   
   doc.setFontSize(10);
   doc.setFont("helvetica", "normal");
   doc.text("Informações do resumo:", 14, 25);
   doc.text(`Cliente: ${clienteNome}`, 14, 30);
   doc.text(`Data: ${formatDateTime(data).split(' ')[0]}`, 14, 35);
   doc.text(`Operador: ${operadorNome}`, 14, 40);
 
   const tableRows: any[] = [];
   let totalEntrada = 0;
   let totalSaida = 0;
   let totalGeral = 0;
   let totalComissoes = 0;
   let totalSaldo = 0;
 
   leituras.forEach((l, index) => {
     const entradaDelta = (l.contador_entrada_atual ?? 0) - (l.contador_entrada_anterior ?? 0);
     const saidaDelta = (l.contador_saida_atual ?? 0) - (l.contador_saida_anterior ?? 0);
     
     totalEntrada += entradaDelta;
     totalSaida += saidaDelta;
     totalGeral += l.valor_faturado;
     totalComissoes += l.valor_comissao;
     totalSaldo += l.valor_liquido;
 
     // Linha 1: Equipamento
     tableRows.push([
       { content: `${index + 1}`, rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
       { content: `${l.maquina_codigo}${l.maquina_modelo ? ` - ${l.maquina_modelo}` : ''}`, colSpan: 5, styles: { fontStyle: 'bold' } }
     ]);
 
     // Linha 2: Anterior / Atual
     const hasCounters = l.contador_entrada_atual !== null && l.contador_entrada_atual !== undefined;
     
     tableRows.push([
       "ANTERIOR",
       hasCounters ? l.contador_entrada_anterior : "— sem contador —",
       hasCounters ? l.contador_saida_anterior : "— sem contador —",
       "", "", ""
     ]);
 
     tableRows.push([
       "ATUAL",
       hasCounters ? l.contador_entrada_atual : "— sem contador —",
       hasCounters ? l.contador_saida_atual : "— sem contador —",
       formatBRL(l.valor_faturado),
       formatBRL(l.valor_comissao),
       formatBRL(l.valor_liquido)
     ]);
 
     // Linha de deltas (opcional, vamos colocar os deltas na linha ATUAL ou numa 4ª se necessário, 
     // mas o modelo sugere que os totais da máquina fiquem numa linha de "resultado")
     // Vamos ajustar para bater com o modelo:
     // N°  EQUIPAMENTO          ENTRADA   SAÍDA    TOTAL      COMISSÃO   RECEBER
     // 1   MAQ-001
     //     ANTERIOR             84758     49271
     //     ATUAL                84943     49346
     //                          185       75       R$ 110,00  R$ 55,00   R$ 55,00
     
     // Corrigindo para 4 linhas por máquina para ficar idêntico ao pedido
     tableRows.pop(); 
     tableRows.pop();
     tableRows.pop();
 
     tableRows.push([
       { content: `${index + 1}`, rowSpan: 4, styles: { valign: 'middle', halign: 'center' } },
       { content: `${l.maquina_codigo}${l.maquina_modelo ? ` - ${l.maquina_modelo}` : ''}`, colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
     ]);
     tableRows.push(["ANTERIOR", hasCounters ? l.contador_entrada_anterior : "—", hasCounters ? l.contador_saida_anterior : "—", "", "", ""]);
     tableRows.push(["ATUAL", hasCounters ? l.contador_entrada_atual : "—", hasCounters ? l.contador_saida_atual : "—", "", "", ""]);
     tableRows.push([
       { content: "", styles: { fillColor: [250, 250, 250] } }, 
       { content: hasCounters ? entradaDelta : "—", styles: { fontStyle: 'bold' } },
       { content: hasCounters ? saidaDelta : "—", styles: { fontStyle: 'bold' } },
       { content: formatBRL(l.valor_faturado), styles: { fontStyle: 'bold' } },
       { content: formatBRL(l.valor_comissao), styles: { fontStyle: 'bold' } },
       { content: formatBRL(l.valor_liquido), styles: { fontStyle: 'bold' } }
     ]);
   });
 
   autoTable(doc, {
     startY: 50,
     head: [["N°", "EQUIPAMENTO", "ENTRADA", "SAÍDA", "TOTAL", "COMISSÃO", "RECEBER"]],
     body: tableRows,
     theme: "grid",
     headStyles: { fillColor: [15, 76, 92], textColor: 255 },
     styles: { fontSize: 8 },
     columnStyles: {
       0: { cellWidth: 10 },
       1: { cellWidth: 50 },
     }
   });
 
   const finalY = (doc as any).lastAutoTable.finalY + 10;
 
   // Rodapé de Totalizadores
   doc.setFont("helvetica", "bold");
   doc.text("ENTRADA TOTAL", 130, finalY);
   doc.text(`${totalEntrada}`, 180, finalY, { align: 'right' });
 
   doc.text("SAÍDA TOTAL", 130, finalY + 5);
   doc.text(`${totalSaida}`, 180, finalY + 5, { align: 'right' });
 
   doc.text("GERAL", 130, finalY + 10);
   doc.text(formatBRL(totalGeral), 180, finalY + 10, { align: 'right' });
 
   doc.text("SUBTOTAL", 130, finalY + 15);
   doc.text(formatBRL(totalGeral), 180, finalY + 15, { align: 'right' });
 
   doc.text("COMISSÕES", 130, finalY + 20);
   doc.text(formatBRL(totalComissoes), 180, finalY + 20, { align: 'right' });
 
   doc.setFontSize(11);
   doc.text("SALDO", 130, finalY + 27);
   doc.text(formatBRL(totalSaldo), 180, finalY + 27, { align: 'right' });
 
   // Audit information
   const pages = doc.getNumberOfPages();
   for (let p = 1; p <= pages; p++) {
     doc.setPage(p);
     doc.setFontSize(7);
     doc.setTextColor(120, 120, 120);
     doc.text("INF. SISTEMA:", 14, 275);
     doc.text(`Versão do sistema: 1.0.0`, 14, 280);
     doc.text(`Gerado em ${formatDateTime(now)}`, 14, 283);
     doc.text(`Documento: ${docId}`, 14, 286);
     doc.text(`Gerado por: ${operadorNome}`, 14, 289);
     doc.text(`Página ${p}/${pages}`, 180, 289);
   }
 
   doc.save(`${docId}.pdf`);
 }
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { sha256Hex } from "./sha256";
import { formatBRL, formatDateTime } from "./format";

interface LeituraPdf {
  id: string;
  data_leitura: string;
  valor_faturado: number;
  pelucias_saidas: number;
  valor_comissao: number;
  valor_liquido: number;
  percentual_aplicado: number;
  observacoes?: string | null;
  cliente: { nome_ponto: string; nome_responsavel: string; cidade: string; estado: string };
  maquina: { codigo_identificacao: string; modelo?: string | null };
  fotos: string[];
  usuario_nome: string;
}

 export async function gerarPdfLeitura(l: LeituraPdf, type: 'a4' | 'thermal' = 'a4') {
   if (type === 'thermal') {
     return gerarPdfLeituraTermico(l);
   }
 
   const doc = new jsPDF();
  const now = new Date();
  const docId = `LEI-${l.id.slice(0, 8).toUpperCase()}-${now.getFullYear()}`;
  const payload = JSON.stringify({
    id: l.id,
    valor: l.valor_faturado,
    comissao: l.valor_comissao,
    pct: l.percentual_aplicado,
    geradoEm: now.toISOString(),
    geradoPor: l.usuario_nome,
  });
  const hash = await sha256Hex(payload);

  // Cabeçalho
  doc.setFillColor(15, 76, 92);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("GruaPro — Relatório de Leitura", 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Empresa de gestão de máquinas de pelúcias", 14, 18);
  doc.text(`Documento: ${docId}`, 14, 23);

  doc.setTextColor(20, 20, 20);
  let y = 38;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente / Ponto", 14, y); y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${l.cliente.nome_ponto} — ${l.cliente.nome_responsavel}`, 14, y); y += 5;
  doc.text(`${l.cliente.cidade}/${l.cliente.estado}`, 14, y); y += 8;

  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("Máquina", 14, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`${l.maquina.codigo_identificacao}${l.maquina.modelo ? ` — ${l.maquina.modelo}` : ""}`, 14, y); y += 8;

  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(`Data da leitura: ${formatDateTime(l.data_leitura)}`, 14, y); y += 8;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Item", "Valor"]],
    body: [
      ["Valor faturado", formatBRL(l.valor_faturado)],
      ["Pelúcias saídas", String(l.pelucias_saidas)],
      [`Comissão do ponto (${l.percentual_aplicado}%)`, formatBRL(l.valor_comissao)],
      ["Valor líquido p/ empresa", formatBRL(l.valor_liquido)],
    ],
    headStyles: { fillColor: [15, 76, 92] },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  if (l.observacoes) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("Observações:", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(l.observacoes, 180);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 4;
  }

  if (l.fotos.length > 0) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(`Fotos (${l.fotos.length}):`, 14, y); y += 4;
    let x = 14;
    for (const url of l.fotos) {
      try {
        const dataUrl = await fetchAsDataURL(url);
        if (y > 240) { doc.addPage(); y = 20; x = 14; }
        doc.addImage(dataUrl, "JPEG", x, y, 55, 41, undefined, "FAST");
        x += 60;
        if (x > 150) { x = 14; y += 45; }
      } catch (e) { console.error(e); }
    }
    y += 50;
  }

  // Rodapé auditável em todas as páginas
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Gerado em ${formatDateTime(now)} por ${l.usuario_nome} | Doc: ${docId} | SHA-256: ${hash.slice(0, 32)}... | Pág ${p}/${pages}`,
      14,
      290
    );
  }

   doc.save(`leitura-${docId}-A4.pdf`);
   return { docId, hash };
 }
 
 export async function gerarPdfLeituraTermico(l: LeituraPdf) {
   // 57mm width, 100mm height (initially, can be dynamic if needed but user said 10cm)
   const doc = new jsPDF({
     unit: "mm",
     format: [57, 100],
   });
 
   const now = new Date();
   const docId = `LEI-${l.id.slice(0, 8).toUpperCase()}-${now.getFullYear()}`;
   const payload = JSON.stringify({
     id: l.id,
     valor: l.valor_faturado,
     comissao: l.valor_comissao,
     pct: l.percentual_aplicado,
     geradoEm: now.toISOString(),
     geradoPor: l.usuario_nome,
   });
   const hash = await sha256Hex(payload);
 
   // Compact design for thermal paper
   doc.setFontSize(10);
   doc.setFont("helvetica", "bold");
   doc.text("GruaPro", 28.5, 8, { align: "center" });
   
   doc.setFontSize(8);
   doc.text("Relatório de Leitura", 28.5, 12, { align: "center" });
   
   doc.setFont("helvetica", "normal");
   doc.setFontSize(7);
   doc.text(`Doc: ${docId}`, 2, 18);
   doc.text(`Data: ${formatDateTime(l.data_leitura)}`, 2, 22);
   
   doc.line(2, 24, 55, 24);
   
   doc.setFont("helvetica", "bold");
   doc.text("Cliente:", 2, 28);
   doc.setFont("helvetica", "normal");
   const clienteLines = doc.splitTextToSize(`${l.cliente.nome_ponto}`, 53);
   doc.text(clienteLines, 2, 31);
   
   let y = 31 + (clienteLines.length * 3);
   
   doc.setFont("helvetica", "bold");
   doc.text("Máquina:", 2, y + 2);
   doc.setFont("helvetica", "normal");
   doc.text(`${l.maquina.codigo_identificacao}`, 2, y + 5);
   
   y += 8;
   doc.line(2, y, 55, y);
   y += 5;
   
   doc.setFontSize(8);
   doc.text("Faturado:", 2, y);
   doc.setFont("helvetica", "bold");
   doc.text(formatBRL(l.valor_faturado), 55, y, { align: "right" });
   
   y += 4;
   doc.setFont("helvetica", "normal");
   doc.text("Saídas:", 2, y);
   doc.text(String(l.pelucias_saidas), 55, y, { align: "right" });
   
   y += 4;
   doc.text(`Comissão (${l.percentual_aplicado}%):`, 2, y);
   doc.text(formatBRL(l.valor_comissao), 55, y, { align: "right" });
   
   y += 5;
   doc.setFontSize(9);
   doc.text("LÍQUIDO:", 2, y);
   doc.setFont("helvetica", "bold");
   doc.text(formatBRL(l.valor_liquido), 55, y, { align: "right" });
   
   y += 7;
   doc.line(2, y, 55, y);
   y += 4;
   
   doc.setFontSize(6);
   doc.setFont("helvetica", "normal");
   doc.text(`SHA-256: ${hash.slice(0, 16)}...`, 2, y);
   doc.text(`Gerado por ${l.usuario_nome}`, 2, y + 3);
   doc.text(`${formatDateTime(now)}`, 2, y + 6);
 
    doc.save(`leitura-${docId}-Termico.pdf`);
    return { docId, hash };
 }

async function fetchAsDataURL(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}