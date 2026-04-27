 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Database } from "@/integrations/supabase/types";
 
 export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
 export type NewCliente = Database["public"]["Tables"]["clientes"]["Insert"];
 export type UpdateCliente = Database["public"]["Tables"]["clientes"]["Update"];
 
 export const CLIENTES_QUERY_KEY = ["clientes"];
 
 export function useClientes(search?: string) {
   const queryClient = useQueryClient();
 
   const query = useQuery({
     queryKey: search ? [...CLIENTES_QUERY_KEY, { search }] : CLIENTES_QUERY_KEY,
     queryFn: async () => {
       let q = supabase.from("clientes").select("*");
       
       if (search) {
         q = q.or(`nome_ponto.ilike.%${search}%,nome_responsavel.ilike.%${search}%,cidade.ilike.%${search}%,telefone_responsavel.ilike.%${search}%`);
       }
       
       const { data, error } = await q.order("nome_ponto");
       if (error) throw error;
       return data;
     },
   });
 
   const createMutation = useMutation({
     mutationFn: async (newCliente: NewCliente) => {
       const { data, error } = await supabase.from("clientes").insert(newCliente).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY });
     },
   });
 
   const updateMutation = useMutation({
     mutationFn: async ({ id, ...changes }: UpdateCliente & { id: string }) => {
       const { data, error } = await supabase.from("clientes").update(changes).eq("id", id).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY });
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("clientes").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY });
     },
   });
 
   return {
     clientes: query.data || [],
     loading: query.isLoading,
     error: query.error,
     createCliente: createMutation.mutateAsync,
     updateCliente: updateMutation.mutateAsync,
     deleteCliente: deleteMutation.mutateAsync,
     isCreating: createMutation.isPending,
     isUpdating: updateMutation.isPending,
     isDeleting: deleteMutation.isPending,
   };
 }