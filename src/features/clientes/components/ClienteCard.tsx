import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Cliente } from "../hooks/useClientes";

interface ClienteCardProps {
  cliente: Cliente;
  showFinancials: boolean;
}

export function ClienteCard({ cliente, showFinancials }: ClienteCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card
      className="p-4 cursor-pointer hover:border-accent transition-colors bg-card"
      onClick={() => navigate(`/clientes/${cliente.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{cliente.nome_ponto}</h3>
          <p className="text-sm text-muted-foreground truncate">{cliente.nome_responsavel}</p>
        </div>
        {!cliente.ativo && <Badge variant="secondary">Inativo</Badge>}
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {cliente.cidade}/{cliente.estado}</div>
        <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {cliente.telefone_responsavel}</div>
         <div className="flex items-center gap-2 text-accent">
           <Percent className="h-3 w-3" /> Comissão: {cliente.percentual_comissao}%
         </div>
      </div>
    </Card>
  );
}
