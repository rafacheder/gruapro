import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { formatBRL, formatNumber } from "@/lib/format";
import { 
  ClipboardList, Users, Cpu, TrendingUp, Plus, Wallet, Package 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { AlertsList } from "@/features/dashboard/components/AlertsList";
import { PeriodFilter } from "@/features/dashboard/components/PeriodFilter";

export default function Dashboard() {
  const { role, nome } = useAuth();
  const navigate = useNavigate();
  const {
    stats,
    periodType,
    setPeriodType,
    customRange,
    setCustomRange,
    alertas,
    loading,
    loadingAlerts
  } = useDashboardStats(role);

  const showFinancials = role === "admin" || role === "master";
  const firstName = (nome || "").split(" ")[0] || "Olá";

  if (role === "usuario") {
    return (
      <div className="space-y-6 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Olá, {firstName}</h1>
          <p className="text-muted-foreground">O que deseja fazer hoje?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate("/leituras/nova")}
            className="h-[120px] md:h-[150px] text-xl md:text-2xl font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
          >
            <Plus className="h-8 w-8 mr-3 md:h-10 md:w-10" /> NOVA LEITURA
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/clientes")}
            className="h-[120px] md:h-[150px] text-xl md:text-2xl font-bold border-2"
          >
            <Users className="h-8 w-8 mr-3 md:h-10 md:w-10" /> CLIENTES
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Resumo geral do sistema"
        action={
          <Button
            onClick={() => navigate("/leituras/nova")}
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova leitura
          </Button>
        }
      />

      <PeriodFilter
        periodType={periodType}
        setPeriodType={setPeriodType}
        customRange={customRange}
        setCustomRange={setCustomRange}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {showFinancials && (
          <>
            <StatCard
              title="Faturamento Total"
              value={loading ? "—" : formatBRL(stats?.faturamentoMes || 0)}
              icon={TrendingUp}
              accent
            />
            <StatCard
              title="Comissão a pagar"
              value={loading ? "—" : formatBRL(stats?.comissaoPendente || 0)}
              icon={Wallet}
            />
            <StatCard
              title="Líquido Total"
              value={loading ? "—" : formatBRL(stats?.liquidoMes || 0)}
              icon={TrendingUp}
            />
          </>
        )}
        <StatCard
          title="Total de Leituras"
          value={loading ? "—" : formatNumber(stats?.leiturasMes || 0)}
          icon={ClipboardList}
          accent={!showFinancials}
        />
        <StatCard
          title="Pelúcias Saídas"
          value={loading ? "—" : formatNumber(stats?.totalPelucias || 0)}
          icon={Package}
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

      <AlertsList alertas={alertas} loadingAlerts={loadingAlerts} />
    </div>
  );
}
