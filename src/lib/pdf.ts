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

export async function gerarPdfLeitura(l: LeituraPdf) {
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

  doc.save(`leitura-${docId}.pdf`);
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