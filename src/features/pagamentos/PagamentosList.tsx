 import { useEffect, useState } from "react";
 import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, CreditCard, Calendar, FileDown } from "lucide-react";
import { Loader2 } from "lucide-react";
import { formatBRL, formatDateTime } from "@/lib/format";
import RegisterPaymentDialog from "./RegisterPaymentDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Pagamento {
  id: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  comprovante_url: string | null;
  observacoes: string | null;
  clientes: { nome_ponto: string };
}

export default function PagamentosList() {
  const { role } = useAuth();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCliente, setFilterCliente] = useState<string>("all");
  const [filterForma, setFilterForma] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nome_ponto: string }[]>([]);

   useEffect(() => {
     loadData();
     loadClientes();
 
     // Realtime subscription to reflect changes immediately
     const channel = supabase
       .channel("pagamentos_changes")
       .on(
         "postgres_changes",
         { event: "*", schema: "public", table: "pagamentos" },
         () => {
           loadData();
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, []);

  async function loadClientes() {
    const { data } = await supabase.from("clientes").select("id, nome_ponto").order("nome_ponto");
    setClientes(data || []);
  }

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("pagamentos")
      .select("*, clientes(nome_ponto)")
      .order("data_pagamento", { ascending: false });
    setPagamentos((data as any) || []);
    setLoading(false);
  }

  const filtered = pagamentos.filter((p) => {
    const matchCliente = filterCliente === "all" || (p as any).cliente_id === filterCliente;
    const matchForma = filterForma === "all" || p.forma_pagamento === filterForma;
    const matchSearch = !search || p.clientes.nome_ponto.toLowerCase().includes(search.toLowerCase()) || (p.observacoes?.toLowerCase().includes(search.toLowerCase()));
    return matchCliente && matchForma && matchSearch;
  });

  const handleDownloadComprovante = async (url: string) => {
    const { data, error } = await supabase.storage.from("comprovantes-pagamento").download(url);
    if (error) return;
    const blobUrl = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `comprovante-${url}`;
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Pagamentos"
        description="Histórico de repasses aos clientes"
        action={
          <Button onClick={() => setDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" /> Registrar Pagamento
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou observação..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterCliente} onValueChange={setFilterCliente}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos clientes</SelectItem>
              {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_ponto}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterForma} onValueChange={setFilterForma}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todas formas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas formas</SelectItem>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="transferencia">Transferência</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum pagamento encontrado"
          description="Tente ajustar os filtros ou registre um novo pagamento."
        />
      ) : (
        <div className="grid gap-3">
           {filtered.map((p) => (
             <Link key={p.id} to={`/pagamentos/${p.id}`}>
               <Card className="p-4 bg-card border-border hover:border-accent transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{p.clientes.nome_ponto}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDateTime(p.data_pagamento)}
                    <Badge variant="outline" className="capitalize ml-2">
                      {p.forma_pagamento}
                    </Badge>
                  </div>
                  {p.observacoes && <p className="text-sm text-muted-foreground mt-2">{p.observacoes}</p>}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="text-lg font-bold text-accent">{formatBRL(p.valor)}</div>
                   {p.comprovante_url && (
                     <Badge variant="outline" className="text-[10px] py-0 h-4">Comprovante</Badge>
                   )}
                </div>
              </div>
            </Card>
             </Link>
          ))}
        </div>
      )}

      <RegisterPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
