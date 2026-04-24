 import { useEffect, useState, useMemo, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useAuth, canManageData } from "@/contexts/AuthContext";
import { Plus, Search, Cpu, Loader2 } from "lucide-react";

interface Maquina {
  id: string;
  codigo_identificacao: string;
  modelo: string | null;
  status: string;
  cliente_id: string;
  clientes: { nome_ponto: string; cidade: string } | null;
}

export default function MaquinasList() {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const canEdit = role !== 'usuario';
  const [items, setItems] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const deferredSearch = useDeferredValue(search);

   useEffect(() => {
     const load = async () => {
       const { data, error } = await supabase
         .from("maquinas")
         .select("id, codigo_identificacao, modelo, status, cliente_id, clientes(nome_ponto, cidade)")
         .order("codigo_identificacao");
       
       if (error) {
         console.error("Erro ao carregar máquinas:", error);
       } else {
         setItems((data as unknown as Maquina[]) || []);
       }
       setLoading(false);
     };
     load();
   }, []);

   const filtered = useMemo(() => {
     const s = deferredSearch.toLowerCase();
     return items.filter((m) => {
       return (
         !s ||
         m.codigo_identificacao.toLowerCase().includes(s) ||
         (m.modelo || "").toLowerCase().includes(s) ||
         (m.clientes?.nome_ponto || "").toLowerCase().includes(s)
       );
     });
   }, [items, deferredSearch]);

  const statusVariant = (s: string) =>
    s === "ativa" ? "default" : s === "manutencao" ? "secondary" : "outline";

  return (
    <div>
      <PageHeader
        title="Máquinas"
        action={
          canEdit && (
            <Button onClick={() => navigate("/maquinas/nova")} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Nova
            </Button>
          )
        }
      />
      <div className="relative mb-4">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código, modelo ou ponto..." className="pl-9" />
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title={search ? "Nenhuma máquina encontrada" : "Nenhuma máquina cadastrada"}
          description={search ? "Tente outra busca" : "Cadastre suas máquinas e vincule-as aos clientes."}
          action={
            canEdit && !search ? (
              <Button onClick={() => navigate("/maquinas/nova")} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" /> Cadastrar máquina
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((m) => (
            <Card key={m.id} className="p-4 cursor-pointer hover:border-accent transition-colors bg-card" onClick={() => navigate(`/maquinas/${m.id}`)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Cpu className="h-5 w-5 text-accent shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m.codigo_identificacao}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.modelo || "Sem modelo"}</div>
                  </div>
                </div>
                <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                📍 {m.clientes?.nome_ponto || "—"} {m.clientes?.cidade && `• ${m.clientes.cidade}`}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}