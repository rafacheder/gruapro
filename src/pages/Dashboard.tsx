import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useAuth, canSeeFinancials } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatNumber } from "@/lib/format";
import { ClipboardList, Users, Cpu, TrendingUp, Plus, Wallet, AlertTriangle, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calcularVariacao } from "@/utils/reading-calculations";
import { formatDate } from "@/lib/format";

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
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

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

  useEffect(() => {
    if (role === 'usuario') return;

    const loadAlerts = async () => {
      setLoadingAlerts(true);
      const { data } = await supabase
        .from("vw_leituras_com_anterior")
        .select("*, maquinas(codigo_identificacao), clientes(nome_ponto)")
        .eq("rn_desc", 1);

      if (data) {
        const inAlert = data.map(l => {
          if (!l.data_leitura_previa) return null;
          const v = calcularVariacao(
            { valor_faturado: Number(l.valor_faturado), pelucias_saidas: l.pelucias_saidas, data_leitura: l.data_leitura },
            { 
              valor_faturado: Number(l.valor_faturado_previo), 
              pelucias_saidas: l.pelucias_saidas_previa, 
              data_leitura: l.data_leitura_previa,
              data_leitura_previa: l.data_leitura_pre_previa
            }
          );
          return v && v.nivelAlerta !== 'normal' ? { ...l, variacao: v } : null;
        }).filter(Boolean);
        setAlertas(inAlert as any[]);
      }
      setLoadingAlerts(false);
    };
    loadAlerts();
  }, [role]);

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

      {role !== 'usuario' && (
        <Card className="mt-6 overflow-hidden border-border">
          <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Máquinas em alerta
            </h3>
            {alertas.length > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                {alertas.length} {alertas.length === 1 ? 'máquina' : 'máquinas'}
              </Badge>
            )}
          </div>
          <div className="p-0">
            {loadingAlerts ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
            ) : alertas.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="flex justify-center"><CheckCircle2 className="h-10 w-10 text-success/40" /></div>
                <p className="text-sm text-muted-foreground">✅ Nenhuma máquina em alerta no momento</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alertas.map((l) => (
                  <div 
                    key={l.id} 
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between group"
                    onClick={() => navigate(`/leituras/${l.id}`)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{l.maquinas?.codigo_identificacao}</span>
                        <span className="text-xs text-muted-foreground">• {l.clientes?.nome_ponto}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold ${l.variacao.nivelAlerta === 'critico' ? 'text-destructive' : 'text-warning'}`}>
                          Queda de {Math.abs(Math.round(l.variacao.variacaoDiaria))}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Leitura em {formatDate(l.data_leitura)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
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