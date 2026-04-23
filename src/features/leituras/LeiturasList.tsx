import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { ClipboardList, Plus, Loader2 } from "lucide-react";
import { useAuth, canSeeFinancials } from "@/contexts/AuthContext";
import { formatBRL, formatDateTime } from "@/lib/format";

export default function LeiturasList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const showFinancials = canSeeFinancials(role);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("leituras")
      .select("id, data_leitura, valor_faturado, valor_comissao, pelucias_saidas, status, maquinas(codigo_identificacao), clientes(nome_ponto)")
      .order("data_leitura", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <PageHeader
        title="Leituras"
        description="Histórico de coletas em campo"
        action={
          <Button onClick={() => navigate("/leituras/nova")} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent">
            <Plus className="h-4 w-4 mr-2" /> Nova
          </Button>
        }
      />
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma leitura ainda"
          description="Faça a primeira leitura para começar."
          action={
            <Button onClick={() => navigate("/leituras/nova")} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Nova leitura
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((l) => (
            <Link key={l.id} to={`/leituras/${l.id}`}>
              <Card className="p-4 hover:border-accent transition-colors bg-card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{l.clientes?.nome_ponto}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {l.maquinas?.codigo_identificacao} • {formatDateTime(l.data_leitura)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatBRL(l.valor_faturado)} • {l.pelucias_saidas} pelúcia(s)
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {showFinancials && (
                    <div className="text-sm font-bold text-accent">{formatBRL(l.valor_comissao)}</div>
                  )}
                  <Badge variant={l.status === "pago" ? "default" : "secondary"} className="mt-1">
                    {l.status === "pendente_pagamento" ? "pendente" : l.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}