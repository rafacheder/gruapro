 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { AppRole } from "@/contexts/AuthContext";
 
 export interface Usuario {
   id: string;
   nome_completo: string;
   email: string | null;
   ativo: boolean;
   role: AppRole | null;
 }
 
 export const USUARIOS_QUERY_KEY = ["usuarios"];
 
 export function useUsuarios() {
   const queryClient = useQueryClient();
 
   const query = useQuery({
     queryKey: USUARIOS_QUERY_KEY,
     queryFn: async () => {
       const [{ data: profiles }, { data: roles }] = await Promise.all([
         supabase.from("profiles").select("id, nome_completo, email, ativo").order("nome_completo"),
         supabase.from("user_roles").select("user_id, role")
       ]);
       
       const map = new Map<string, AppRole>();
       (roles || []).forEach((r) => {
         const cur = map.get(r.user_id);
         const rank = (x: AppRole) => x === "master" ? 1 : x === "admin" ? 2 : 3;
         if (!cur || rank(r.role as AppRole) < rank(cur)) map.set(r.user_id, r.role as AppRole);
       });
       
       return (profiles || []).map((p) => ({ ...p, role: map.get(p.id) ?? null })) as Usuario[];
     },
   });
 
    const createMutation = useMutation({
      mutationFn: async (formData: any) => {
        const { data, error } = await supabase.functions.invoke("manage-users", {
          body: { action: "create", ...formData },
        });
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      },
    });

    const updateMutation = useMutation({
      mutationFn: async ({ user_id, ...payload }: { user_id: string; email?: string; password?: string; nome_completo?: string }) => {
        const { data, error } = await supabase.functions.invoke("manage-users", {
          body: { action: "update", user_id, ...payload },
        });
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      },
    });

    const deleteMutation = useMutation({
      mutationFn: async (user_id: string) => {
        const { data, error } = await supabase.functions.invoke("manage-users", {
          body: { action: "delete", user_id },
        });
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      },
    });

   const changeRoleMutation = useMutation({
     mutationFn: async ({ uid, newRole }: { uid: string, newRole: AppRole }) => {
       await supabase.from("user_roles").delete().eq("user_id", uid);
       const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: newRole });
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
     },
   });
 
   return {
     usuarios: query.data || [],
     loading: query.isLoading,
     error: query.error,
      createUser: createMutation.mutateAsync,
      updateUser: updateMutation.mutateAsync,
      deleteUser: deleteMutation.mutateAsync,
      changeRole: changeRoleMutation.mutateAsync,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      isChangingRole: changeRoleMutation.isPending,
   };
 }