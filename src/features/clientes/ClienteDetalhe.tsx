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
import { useAuth, canManageData, canSeeFinancials, isUser } from "@/contexts/AuthContext";
 import { ArrowLeft, Pencil, Trash2, Cpu, ClipboardList, Loader2, FileText, ChevronDown, Printer } from "lucide-react";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
import { formatBRL, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export default function ClienteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const canEdit = canManageData(role);
  const showFinancials = canSeeFinancials(role);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cliente, setCliente] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [maquinas, setMaquinas] = useState<any[]>([]);
   const [leituras, setLeituras] = useState<any[]>([]);
   const [totalPago, setTotalPago] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
       const [{ data: cli }, { data: maq }, { data: lei }, { data: pag }] = await Promise.all([
        supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
        supabase.from("maquinas").select("id, codigo_identificacao, modelo, status").eq("cliente_id", id),
        supabase.from("leituras").select("id, data_leitura, valor_faturado, valor_comissao, valor_liquido, status").eq("cliente_id", id).order("data_leitura", { ascending: false }).limit(20),
         supabase.from("pagamentos").select("valor").eq("cliente_id", id),
      ]);
      setCliente(cli);
      setMaquinas(maq || []);
      setLeituras(lei || []);
       setTotalPago(pag?.reduce((acc, p) => acc + Number(p.valor), 0) || 0);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      await logAudit({ acao: "DELETE_CLIENTE", tabela: "clientes", registro_id: id, dados_antes: cliente });
      toast.success("Cliente excluído");
      navigate("/clientes");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir (verifique se há máquinas vinculadas)");
    }
  };

  if (isUser(role)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground mb-4">Você não tem permissão para ver detalhes de clientes.</p>
        <Button onClick={() => navigate("/clientes")}>Voltar para Lista</Button>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  if (!cliente) return <div>Cliente não encontrado</div>;

  const totalComissaoPendente = leituras
    .filter((l) => l.status === "pendente")
    .reduce((s, l) => s + Number(l.valor_comissao), 0);

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/clientes")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Clientes
      </Button>
      <PageHeader
        title={cliente.nome_ponto}
        description={`${cliente.nome_responsavel} • ${cliente.cidade}/${cliente.estado}`}
        action={
          canEdit && (
            <div className="flex gap-2">
                <div className="flex">
                  <Button variant="outline" size="sm" className="rounded-r-none border-r-0" onClick={() => {
                    const period = prompt("Digite o período (ex: 30 para últimos 30 dias, ou deixe em branco para todas as recentes):", "30");
                    if (period === null) return;
                    const limit = parseInt(period) || 100;
                    const ids = leituras.slice(0, limit).map(l => l.id);
                    if (ids.length === 0) {
                      toast.error("Nenhuma leitura encontrada para este cliente.");
                      return;
                    }
                    navigate(`/leituras/consolidado?ids=${ids.join(",")}`);
                  }}>
                    <FileText className="h-4 w-4 mr-1" /> Relatório
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-l-none px-2 border-l-0">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const ids = leituras.slice(0, 30).map(l => l.id);
                        if (ids.length === 0) return;
                        navigate(`/leituras/consolidado?ids=${ids.join(",")}&format=a4`);
                      }}>
                        <FileText className="h-4 w-4 mr-2" /> PDF A4 (Padrão)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const ids = leituras.slice(0, 30).map(l => l.id);
                        if (ids.length === 0) return;
                        navigate(`/leituras/consolidado?ids=${ids.join(",")}&format=thermal`);
                      }}>
                        <Printer className="h-4 w-4 mr-2" /> PDF Bobina 57mm
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
               <Button variant="secondary" size="sm" onClick={() => navigate(`/clientes/${id}/editar`)}>
                 <Pencil className="h-4 w-4 mr-1" /> Editar
               </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Não será possível excluir se houver máquinas ou leituras vinculadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 bg-card">
          <h3 className="font-semibold mb-3">Endereço</h3>
          <p className="text-sm text-muted-foreground">
            {cliente.rua}, {cliente.numero}{cliente.complemento ? ` — ${cliente.complemento}` : ""}<br />
            {cliente.bairro} • {cliente.cidade}/{cliente.estado}<br />
            CEP {cliente.cep}
          </p>
        </Card>
        <Card className="p-5 bg-card">
          <h3 className="font-semibold mb-3">Contato & contrato</h3>
          <p className="text-sm text-muted-foreground">
            Telefone: <span className="text-foreground">{cliente.telefone_responsavel}</span><br />
            {cliente.email && <>Email: <span className="text-foreground">{cliente.email}</span><br /></>}
            {showFinancials && <>Comissão: <span className="text-accent font-semibold">{cliente.percentual_comissao}%</span><br /></>}
            Status: <Badge variant={cliente.ativo ? "default" : "secondary"}>{cliente.ativo ? "Ativo" : "Inativo"}</Badge>
          </p>
       {showFinancials && (
         <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-4">
           <div>
             <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">A receber (pendente)</div>
             <div className="text-xl font-bold text-warning">{formatBRL(totalComissaoPendente)}</div>
           </div>
           <div>
             <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total pago (histórico)</div>
             <div className="text-xl font-bold text-success">{formatBRL(totalPago)}</div>
           </div>
         </div>
       )}
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Máquinas neste ponto ({maquinas.length})</h3>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/maquinas/nova?cliente=${id}`)}>
              + Adicionar máquina
            </Button>
          )}
        </div>
        {maquinas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma máquina vinculada.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {maquinas.map((m) => (
              <Card key={m.id} className="p-4 cursor-pointer hover:border-accent transition-colors bg-card" onClick={() => navigate(`/maquinas/${m.id}`)}>
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-accent" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.codigo_identificacao}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.modelo || "—"}</div>
                  </div>
                  <Badge className="ml-auto" variant={m.status === "ativa" ? "default" : "secondary"}>{m.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Últimas leituras</h3>
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
                      <div className="text-xs text-muted-foreground">Faturamento: {formatBRL(l.valor_faturado)}</div>
                    </div>
                  </div>
                  {showFinancials && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Comissão</div>
                      <div className="text-sm font-semibold text-accent">{formatBRL(l.valor_comissao)}</div>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}