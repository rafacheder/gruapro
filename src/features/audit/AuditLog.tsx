import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default function AuditLog() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("audit_log")
      .select("*, profiles!audit_log_usuario_id_fkey(nome_completo, email)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => { setRows(data || []); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader title="Audit log" description="Últimas 200 ações registradas" />
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-3 bg-card text-sm flex items-center gap-3 flex-wrap">
              <div className="text-xs text-muted-foreground w-32 shrink-0">{formatDateTime(r.created_at)}</div>
              <Badge variant="outline">{r.acao}</Badge>
              <Badge variant="secondary">{r.tabela}</Badge>
              <div className="flex-1 min-w-0 text-xs text-muted-foreground truncate">
                {r.profiles?.nome_completo || r.profiles?.email || r.usuario_id?.slice(0, 8)}
                {r.registro_id && ` • ${r.registro_id.slice(0, 8)}`}
              </div>
            </Card>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro.</p>}
        </div>
      )}
    </div>
  );
}