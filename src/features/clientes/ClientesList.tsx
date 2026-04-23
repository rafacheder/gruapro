import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useAuth, canManageData, canSeeFinancials } from "@/contexts/AuthContext";
import { Plus, Search, Users, MapPin, Phone, Percent } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Cliente {
  id: string;
  nome_ponto: string;
  nome_responsavel: string;
  telefone_responsavel: string;
  cidade: string;
  estado: string;
  percentual_comissao: number;
  ativo: boolean;
}

export default function ClientesList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const showFinancials = canSeeFinancials(role);
  const canEdit = canManageData(role);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("clientes")
        .select("id, nome_ponto, nome_responsavel, telefone_responsavel, cidade, estado, percentual_comissao, ativo")
        .order("nome_ponto");
      setClientes(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = clientes.filter((c) => {
    const s = search.toLowerCase();
    return (
      !s ||
      c.nome_ponto.toLowerCase().includes(s) ||
      c.nome_responsavel.toLowerCase().includes(s) ||
      c.cidade.toLowerCase().includes(s) ||
      c.telefone_responsavel.includes(s)
    );
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Pontos parceiros que recebem máquinas"
        action={
          canEdit && (
            <Button onClick={() => navigate("/clientes/novo")} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Novo
            </Button>
          )
        }
      />

      <div className="relative mb-4">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, responsável, cidade ou telefone..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          description={search ? "Tente outra busca" : "Comece cadastrando seu primeiro ponto parceiro."}
          action={
            canEdit && !search ? (
              <Button onClick={() => navigate("/clientes/novo")} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" /> Cadastrar cliente
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="p-4 cursor-pointer hover:border-accent transition-colors bg-card"
              onClick={() => navigate(`/clientes/${c.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{c.nome_ponto}</h3>
                  <p className="text-sm text-muted-foreground truncate">{c.nome_responsavel}</p>
                </div>
                {!c.ativo && <Badge variant="secondary">Inativo</Badge>}
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {c.cidade}/{c.estado}</div>
                <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {c.telefone_responsavel}</div>
                {showFinancials && (
                  <div className="flex items-center gap-2 text-accent">
                    <Percent className="h-3 w-3" /> Comissão: {c.percentual_comissao}%
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}