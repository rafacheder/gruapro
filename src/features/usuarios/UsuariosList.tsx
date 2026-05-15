 import { useState } from "react";
 import { useUsuarios } from "@/hooks/useUsuarios";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { toast } from "sonner";
 import { Edit, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
import { logAudit } from "@/lib/audit";

interface Row { id: string; nome_completo: string; email: string | null; ativo: boolean; role: AppRole | null; }

 export default function UsuariosList() {
   const { role: myRole, user } = useAuth();
    const { 
      usuarios, 
      loading, 
      createUser: createUserHook, 
      updateUser: updateUserHook, 
      deleteUser: deleteHook, 
      changeRole: changeRoleHook, 
      isCreating,
      isUpdating,
      isDeleting
    } = useUsuarios();

    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

   const [formData, setFormData] = useState({ username: "", password: "", nome_completo: "" });
    const [editData, setEditData] = useState({ email: "", password: "", nome_completo: "" });

    const handleEdit = (u: any) => {
      setSelectedUser(u);
      setEditData({ email: u.email || "", password: "", nome_completo: u.nome_completo || "" });
      setEditOpen(true);
    };

    const updateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await updateUserHook({
          user_id: selectedUser.id,
          email: editData.email,
          nome_completo: editData.nome_completo,
          ...(editData.password ? { password: editData.password } : {})
        });
        toast.success("Usuário atualizado");
        setEditOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Erro ao atualizar");
      }
    };

    const confirmDelete = (u: any) => {
      setSelectedUser(u);
      setDeleteOpen(true);
    };

    const deleteUser = async () => {
      try {
        await deleteHook(selectedUser.id);
        toast.success("Usuário removido");
        setDeleteOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Erro ao remover");
      }
    };

   const createUser = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       await createUserHook(formData);
       toast.success("Usuário criado com sucesso");
       setOpen(false);
       setFormData({ username: "", password: "", nome_completo: "" });
     } catch (err: any) {
       toast.error(err.message || "Erro ao criar usuário");
     }
   };

   const changeRole = async (uid: string, newRole: AppRole) => {
     if (uid === user?.id) { toast.error("Você não pode alterar seu próprio papel"); return; }
     try {
       await changeRoleHook({ uid, newRole });
       await logAudit({ acao: "CHANGE_ROLE", tabela: "user_roles", registro_id: uid, dados_depois: { role: newRole } });
       toast.success("Papel atualizado");
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
                <Button type="submit" className="w-full bg-accent" disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
           {usuarios.map((r) => (
            <Card key={r.id} className="p-4 bg-card flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{r.nome_completo || "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{r.email}</div>
              </div>
               <div className="flex items-center gap-2">
                 <Badge variant={r.ativo ? "default" : "secondary"}>{r.ativo ? "ativo" : "inativo"}</Badge>
                 
                 {myRole === "master" ? (
                   <Select value={r.role ?? "usuario"} onValueChange={(v: AppRole) => changeRole(r.id, v)}>
                     <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="usuario">Usuário</SelectItem>
                       <SelectItem value="admin">Admin</SelectItem>
                       <SelectItem value="master">Master</SelectItem>
                     </SelectContent>
                   </Select>
                 ) : (
                   <Badge variant="outline" className="capitalize">{r.role ?? "—"}</Badge>
                 )}

                 {(myRole === "master" || myRole === "admin") && r.id !== user?.id && (
                   <div className="flex gap-1">
                     <Button size="icon" variant="ghost" onClick={() => handleEdit(r)} className="h-8 w-8">
                       <Edit className="h-4 w-4" />
                     </Button>
                     <Button size="icon" variant="ghost" onClick={() => confirmDelete(r)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 )}
               </div>
            </Card>
          ))}
        </div>
      )}

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={updateUser} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  value={editData.nome_completo}
                  onChange={(e) => setEditData({ ...editData, nome_completo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nova Senha (deixe em branco para não alterar)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editData.password}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full bg-accent" disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover Usuário</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              Tem certeza que deseja remover o usuário <strong>{selectedUser?.nome_completo || selectedUser?.email}</strong>? 
              Esta ação não pode ser desfeita.
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={deleteUser} disabled={isDeleting}>
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }