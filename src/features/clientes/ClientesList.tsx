import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useAuth, canManageData, canSeeFinancials } from "@/contexts/AuthContext";
import { Plus, Search, Users, Loader2 } from "lucide-react";
import { useClientes } from "./hooks/useClientes";
import { ClienteCard } from "./components/ClienteCard";

export default function ClientesList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const { clientes, loading } = useClientes(search);

   const showFinancials = true;
   const canEdit = true;

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
      ) : clientes.length === 0 ? (
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
          {clientes.map((c) => (
            <ClienteCard key={c.id} cliente={c} showFinancials={showFinancials} />
          ))}
        </div>
      )}
    </div>
  );
}
