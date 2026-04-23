import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import { useAuth, canManageData, canSeeFinancials } from "@/contexts/AuthContext";
import { ArrowLeft, Pencil, Trash2, ClipboardList, Plus, Loader2 } from "lucide-react";
import { formatBRL, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export default function MaquinaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const canEdit = canManageData(role);
  const showFinancials = canSeeFinancials(role);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [maquina, setMaquina] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leituras, setLeituras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: m }, { data: l }] = await Promise.all([
        supabase.from("maquinas").select("*, clientes(id, nome_ponto, cidade, percentual_comissao)").eq("id", id).maybeSingle(),
        supabase.from("leituras").select("id, data_leitura, valor_faturado, valor_comissao, pelucias_saidas, status").eq("maquina_id", id).order("data_leitura", { ascending: false }).limit(20),
      ]);
      setMaquina(m);
      setLeituras(l || []);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("maquinas").delete().eq("id", id);
      if (error) throw error;
      await logAudit({ acao: "DELETE_MAQUINA", tabela: "maquinas", registro_id: id, dados_antes: maquina });
      toast.success("Máquina excluída");
      navigate("/maquinas");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir (verifique se há leituras)");
    }
  };

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

      <Card className="p-5 bg-card mb-6">
        <div className="text-sm text-muted-foreground">Cliente</div>
        <Link to={`/clientes/${maquina.clientes?.id}`} className="text-lg font-semibold hover:text-accent">
          {maquina.clientes?.nome_ponto}
        </Link>
        <div className="text-sm text-muted-foreground">{maquina.clientes?.cidade}</div>
        {maquina.observacoes && <p className="text-sm text-muted-foreground mt-3">{maquina.observacoes}</p>}
      </Card>

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
                  <Badge variant={l.status === "pago" ? "default" : "secondary"}>{l.status === "pendente_pagamento" ? "pendente" : l.status}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}