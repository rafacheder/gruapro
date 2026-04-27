 import { useState, useEffect } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card } from "@/components/ui/card";
 import PageHeader from "@/components/PageHeader";
 import { toast } from "sonner";
 import { Loader2, User } from "lucide-react";
 import { maskPhone, onlyDigits } from "@/lib/format";
 
 export default function Profile() {
   const { user, nome, refreshRole } = useAuth();
   const [nomeCompleto, setNomeCompleto] = useState("");
   const [telefone, setTelefone] = useState("");
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
 
   useEffect(() => {
     const loadProfile = async () => {
       if (!user) return;
       const { data, error } = await supabase
         .from("profiles")
         .select("nome_completo, telefone")
         .eq("id", user.id)
         .maybeSingle();
       
       if (data) {
         setNomeCompleto(data.nome_completo || "");
         setTelefone(maskPhone(data.telefone || ""));
       }
       setLoading(false);
     };
     loadProfile();
   }, [user]);
 
   const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
     setSaving(true);
     try {
       const { error } = await supabase
         .from("profiles")
         .update({
           nome_completo: nomeCompleto,
           telefone: onlyDigits(telefone)
         })
         .eq("id", user.id);
       
       if (error) throw error;
       await refreshRole();
       toast.success("Perfil atualizado com sucesso");
     } catch (err: any) {
       toast.error(err.message || "Erro ao salvar perfil");
     } finally {
       setSaving(false);
     }
   };
 
   if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
 
   return (
     <div>
       <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais" />
       
       <Card className="max-w-2xl p-6 bg-card">
         <form onSubmit={handleSave} className="space-y-6">
           <div className="flex items-center gap-4 mb-6">
             <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center text-accent">
               <User className="h-8 w-8" />
             </div>
             <div>
               <p className="font-semibold text-lg">{nome || user?.email}</p>
               <p className="text-sm text-muted-foreground">{user?.email}</p>
             </div>
           </div>
 
           <div className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="email">Email</Label>
               <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
               <p className="text-[10px] text-muted-foreground italic">O email é gerenciado pelo sistema e não pode ser alterado aqui.</p>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="nome_completo">Nome Completo</Label>
               <Input 
                 id="nome_completo" 
                 value={nomeCompleto} 
                 onChange={(e) => setNomeCompleto(e.target.value)} 
                 placeholder="Seu nome completo"
                 required
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="telefone">Telefone</Label>
               <Input 
                 id="telefone" 
                 value={telefone} 
                 onChange={(e) => setTelefone(maskPhone(e.target.value))} 
                 placeholder="(00) 00000-0000"
               />
             </div>
           </div>
 
           <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={saving}>
             {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
             Salvar Alterações
           </Button>
         </form>
       </Card>
     </div>
   );
 }