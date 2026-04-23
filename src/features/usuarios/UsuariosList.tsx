import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
 import { Loader2, Plus, UserPlus } from "lucide-react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
import { logAudit } from "@/lib/audit";

interface Row { id: string; nome_completo: string; email: string | null; ativo: boolean; role: AppRole | null; }

export default function UsuariosList() {
  const { role: myRole, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
   const [loading, setLoading] = useState(true);
   const [creating, setCreating] = useState(false);
   const [open, setOpen] = useState(false);
   const [formData, setFormData] = useState({ username: "", password: "", nome_completo: "" });
   const createUser = async (e: React.FormEvent) => {
     e.preventDefault();
     setCreating(true);
     try {
       const { data, error } = await supabase.functions.invoke("manage-users", {
         body: { action: "create", ...formData },
       });
       if (error) throw error;
       toast.success("Usuário criado com sucesso");
       setOpen(false);
       setFormData({ username: "", password: "", nome_completo: "" });
       load();
     } catch (err: any) {
       toast.error(err.message || "Erro ao criar usuário");
     } finally {
       setCreating(false);
     }
   };
 

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
     <div className="space-y-6">
       <div className="flex justify-between items-center">
         <PageHeader title="Usuários" description="Gerencie quem acessa o sistema" />
         <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
             <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
               <Plus className="h-4 w-4 mr-2" />
               Novo Usuário
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Criar Novo Usuário</DialogTitle>
             </DialogHeader>
             <form onSubmit={createUser} className="space-y-4 pt-4">
               <div className="space-y-2">
                 <Label htmlFor="new-name">Nome Completo</Label>
                 <Input
                   id="new-name"
                   value={formData.nome_completo}
                   onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="new-username">Usuário (ou Email)</Label>
                 <Input
                   id="new-username"
                   value={formData.username}
                   onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                   required
                   placeholder="Ex: joao"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="new-password">Senha</Label>
                 <Input
                   id="new-password"
                   type="password"
                   value={formData.password}
                   onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                   required
                   minLength={6}
                 />
               </div>
               <Button type="submit" className="w-full bg-accent" disabled={creating}>
                 {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                 Criar Usuário
               </Button>
             </form>
           </DialogContent>
         </Dialog>
       </div>
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
        </div>
      )}
    </div>
  );
}