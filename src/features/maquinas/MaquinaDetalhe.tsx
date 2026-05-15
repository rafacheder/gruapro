import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { useMaquinas } from "./hooks/useMaquinas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
 import { ArrowLeft, Pencil, Trash2, ClipboardList, Plus, Loader2, QrCode, Download } from "lucide-react";
 import QRCode from "qrcode";
 import { jsPDF } from "jspdf";
import { formatBRL, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export default function MaquinaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const canEdit = role !== 'usuario';
  const showFinancials = true;

   const { maquinas, loading: loadingList, deleteMaquina } = useMaquinas();
   const [leituras, setLeituras] = useState<any[]>([]);
   const [loadingInternal, setLoadingInternal] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

   const maquina = maquinas.find(m => m.id === id);
 
   useEffect(() => {
     const loadRelated = async () => {
       if (!id) return;
       const { data: l } = await supabase.from("leituras").select("id, data_leitura, valor_faturado, valor_comissao, pelucias_saidas, status").eq("maquina_id", id).order("data_leitura", { ascending: false }).limit(20);
       setLeituras(l || []);
       
       if (maquina) {
         const url = `${window.location.origin}/maquina/${maquina.id}`;
         const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
         setQrCodeDataUrl(dataUrl);
       }
       
       setLoadingInternal(false);
     };
     if (!loadingList) loadRelated();
   }, [id, maquina, loadingList]);

  const handleDownloadLabel = () => {
    if (!maquina) return;
    
    // A6 size is 105 x 148 mm
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a6",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Ponto Name
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const pontoName = maquina.clientes?.nome_ponto || "Ponto sem nome";
    doc.text(pontoName, pageWidth / 2, 15, { align: "center" });

    // QR Code (Center)
    const qrSize = 70;
    doc.addImage(qrCodeDataUrl, "PNG", (pageWidth - qrSize) / 2, 25, qrSize, qrSize);

    // Machine Code
    doc.setFontSize(18);
    doc.text(maquina.codigo_identificacao, pageWidth / 2, 105, { align: "center" });
    
    // Instructions
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Acesse para registrar nova leitura", pageWidth / 2, 115, { align: "center" });

    doc.save(`etiqueta-${maquina.codigo_identificacao}.pdf`);
    toast.success("Etiqueta PDF gerada");
  };

   const handleDelete = async () => {
     try {
       if (!id) return;
       await deleteMaquina(id);
       await logAudit({ acao: "DELETE_MAQUINA", tabela: "maquinas", registro_id: id, dados_antes: maquina });
       toast.success("Máquina excluída");
       navigate("/maquinas");
     } catch (err: unknown) {
       toast.error(err instanceof Error ? err.message : "Erro ao excluir (verifique se há leituras)");
     }
   };
 
   const loading = loadingList || loadingInternal;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  if (!maquina) return <div>Máquina não encontrada</div>;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/maquinas")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Máquinas
      </Button>
      <PageHeader
        title={maquina.codigo_identificacao}
        description={`${maquina.modelo || "Sem modelo"} • Status: ${maquina.status}`}
        action={
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={handleDownloadLabel} className="hidden sm:flex">
                <Download className="h-4 w-4 mr-2" /> Etiqueta
              </Button>
            )}
            <Button onClick={() => navigate(`/leituras/nova?maquina=${id}`)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Leitura
            </Button>
            {canEdit && (
              <>
                <Button variant="secondary" size="icon" onClick={() => navigate(`/maquinas/${id}/editar`)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir máquina?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-5 bg-card md:col-span-2">
          <div className="text-sm text-muted-foreground">Cliente</div>
          <Link to={`/clientes/${maquina.clientes?.id}`} className="text-lg font-semibold hover:text-accent">
            {maquina.clientes?.nome_ponto}
          </Link>
          <div className="text-sm text-muted-foreground">{maquina.clientes?.cidade}</div>
          {maquina.observacoes && <p className="text-sm text-muted-foreground mt-3">{maquina.observacoes}</p>}
        </Card>

        <Card className="p-5 bg-card flex flex-col items-center justify-center text-center">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <QrCode className="h-3 w-3" /> QR Code da Máquina
          </div>
          {qrCodeDataUrl ? (
            <div className="bg-white p-2 rounded-lg mb-3">
              <img src={qrCodeDataUrl} alt="QR Code" className="h-32 w-32" />
            </div>
          ) : (
            <div className="h-32 w-32 bg-muted animate-pulse rounded-lg mb-3" />
          )}
          {canEdit && (
            <Button variant="outline" size="sm" onClick={handleDownloadLabel} className="w-full">
              <Download className="h-3 w-3 mr-2" /> Baixar PDF
            </Button>
          )}
        </Card>
      </div>

      <h3 className="font-semibold mb-3">Histórico de leituras</h3>
      {leituras.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma leitura ainda.</p>
      ) : (
        <div className="space-y-2">
          {leituras.map((l) => (
            <Link key={l.id} to={`/leituras/${l.id}`}>
              <Card className="p-3 hover:border-accent transition-colors bg-card flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{formatDateTime(l.data_leitura)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatBRL(l.valor_faturado)} • {l.pelucias_saidas} pelúcia(s)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showFinancials && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Comissão</div>
                      <div className="text-sm font-semibold text-accent">{formatBRL(l.valor_comissao)}</div>
                    </div>
                  )}
                  <Badge variant={l.status === "pago" ? "default" : "secondary"}>{l.status === "pendente" ? "pendente" : l.status}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}