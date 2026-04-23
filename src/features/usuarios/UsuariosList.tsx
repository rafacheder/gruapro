import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { logAudit } from "@/lib/audit";

interface Row { id: string; nome_completo: string; email: string | null; ativo: boolean; role: AppRole | null; }

export default function UsuariosList() {
  const { role: myRole, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id, nome_completo, email, ativo").order("nome_completo");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const map = new Map<string, AppRole>();
    (roles || []).forEach((r) => {
      const cur = map.get(r.user_id);
      const rank = (x: AppRole) => x === "master" ? 1 : x === "admin" ? 2 : 3;
      if (!cur || rank(r.role as AppRole) < rank(cur)) map.set(r.user_id, r.role as AppRole);
    });
    setRows((profiles || []).map((p) => ({ ...p, role: map.get(p.id) ?? null })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (uid: string, newRole: AppRole) => {
    if (uid === user?.id) { toast.error("Você não pode alterar seu próprio papel"); return; }
    try {
      await supabase.from("user_roles").delete().eq("user_id", uid);
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: newRole });
      if (error) throw error;
      await logAudit({ acao: "CHANGE_ROLE", tabela: "user_roles", registro_id: uid, dados_depois: { role: newRole } });
      toast.success("Papel atualizado");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <div>
      <PageHeader title="Usuários" description="Gerencie quem acessa o sistema" />
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-4 bg-card flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{r.nome_completo || "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{r.email}</div>
              </div>
              <Badge variant={r.ativo ? "default" : "secondary"}>{r.ativo ? "ativo" : "inativo"}</Badge>
              {myRole === "master" ? (
                <Select value={r.role ?? "usuario"} onValueChange={(v: AppRole) => changeRole(r.id, v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usuario">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="capitalize">{r.role ?? "—"}</Badge>
              )}
            </Card>
          ))}
          <p className="text-xs text-muted-foreground mt-4">
            Para criar um novo usuário, peça que ele acesse a tela de login e crie a conta. Depois, defina o papel aqui.
          </p>
        </div>
      )}
    </div>
  );
}