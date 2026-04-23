import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useAuth, canSeeFinancials } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatNumber } from "@/lib/format";
import { ClipboardList, Users, Cpu, TrendingUp, Plus, Wallet } from "lucide-react";

interface Stats {
  faturamentoMes: number;
  comissaoMes: number;
  liquidoMes: number;
  clientesAtivos: number;
  maquinasAtivas: number;
  leiturasMes: number;
  minhasLeiturasHoje: number;
}

export default function Dashboard() {
  const { role, nome } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);

      const [leiturasMes, clientesAtivos, maquinasAtivas, minhasHoje] = await Promise.all([
        supabase
          .from("leituras")
          .select("valor_faturado, valor_comissao, valor_liquido")
          .gte("data_leitura", inicioMes.toISOString()),
        supabase.from("clientes").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("maquinas").select("id", { count: "exact", head: true }).eq("status", "ativa"),
        supabase
          .from("leituras")
          .select("id", { count: "exact", head: true })
          .gte("data_leitura", inicioHoje.toISOString()),
      ]);

      const rows = leiturasMes.data || [];
      setStats({
        faturamentoMes: rows.reduce((s, r) => s + Number(r.valor_faturado), 0),
        comissaoMes: rows.reduce((s, r) => s + Number(r.valor_comissao), 0),
        liquidoMes: rows.reduce((s, r) => s + Number(r.valor_liquido), 0),
        clientesAtivos: clientesAtivos.count || 0,
        maquinasAtivas: maquinasAtivas.count || 0,
        leiturasMes: rows.length,
        minhasLeiturasHoje: minhasHoje.count || 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const showFinancials = canSeeFinancials(role);
  const firstName = (nome || "").split(" ")[0] || "Olá";

  return (
    <div>
      <PageHeader
        title={`Olá, ${firstName}`}
        description={
          role === "usuario"
            ? "Pronto para fazer leituras em campo?"
            : "Resumo do mês corrente"
        }
        action={
          <Button
            onClick={() => navigate("/leituras/nova")}
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova leitura
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {showFinancials && (
          <>
            <StatCard
              title="Faturamento do mês"
              value={loading ? "—" : formatBRL(stats?.faturamentoMes || 0)}
              icon={TrendingUp}
              accent
            />
            <StatCard
              title="Comissão a pagar"
              value={loading ? "—" : formatBRL(stats?.comissaoMes || 0)}
              icon={Wallet}
            />
            <StatCard
              title="Líquido do mês"
              value={loading ? "—" : formatBRL(stats?.liquidoMes || 0)}
              icon={TrendingUp}
            />
            <StatCard
              title="Leituras no mês"
              value={loading ? "—" : formatNumber(stats?.leiturasMes || 0)}
              icon={ClipboardList}
            />
          </>
        )}
        {!showFinancials && (
          <>
            <StatCard
              title="Suas leituras hoje"
              value={loading ? "—" : formatNumber(stats?.minhasLeiturasHoje || 0)}
              icon={ClipboardList}
              accent
            />
            <StatCard
              title="Clientes ativos"
              value={loading ? "—" : formatNumber(stats?.clientesAtivos || 0)}
              icon={Users}
            />
            <StatCard
              title="Máquinas ativas"
              value={loading ? "—" : formatNumber(stats?.maquinasAtivas || 0)}
              icon={Cpu}
            />
          </>
        )}
        {showFinancials && (
          <>
            <StatCard title="Clientes ativos" value={loading ? "—" : formatNumber(stats?.clientesAtivos || 0)} icon={Users} />
            <StatCard title="Máquinas ativas" value={loading ? "—" : formatNumber(stats?.maquinasAtivas || 0)} icon={Cpu} />
          </>
        )}
      </div>

      <Card className="mt-6 p-5 bg-gradient-surface border-border">
        <h3 className="font-semibold mb-3">Acesso rápido</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate("/leituras/nova")}>
            <Plus className="h-4 w-4 mr-2" /> Nova leitura
          </Button>
          <Button variant="secondary" onClick={() => navigate("/leituras")}>
            <ClipboardList className="h-4 w-4 mr-2" /> Ver leituras
          </Button>
          <Button variant="secondary" onClick={() => navigate("/clientes")}>
            <Users className="h-4 w-4 mr-2" /> Clientes
          </Button>
          <Button variant="secondary" onClick={() => navigate("/maquinas")}>
            <Cpu className="h-4 w-4 mr-2" /> Máquinas
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <Card
      className={`p-4 md:p-5 border-border ${
        accent ? "bg-gradient-accent text-accent-foreground border-transparent shadow-accent" : "bg-card shadow-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`text-xs font-medium uppercase tracking-wide ${accent ? "text-accent-foreground/80" : "text-muted-foreground"}`}>
          {title}
        </div>
        <Icon className={`h-4 w-4 ${accent ? "text-accent-foreground/80" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 text-xl md:text-2xl font-bold ${accent ? "text-accent-foreground" : "text-foreground"}`}>
        {value}
      </div>
    </Card>
  );
}