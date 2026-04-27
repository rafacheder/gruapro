 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Database } from "@/integrations/supabase/types";
 
 export type Maquina = Database["public"]["Tables"]["maquinas"]["Row"] & {
   clientes: { nome_ponto: string; cidade: string } | null;
 };
 export type NewMaquina = Database["public"]["Tables"]["maquinas"]["Insert"];
 export type UpdateMaquina = Database["public"]["Tables"]["maquinas"]["Update"];
 
 export const MAQUINAS_QUERY_KEY = ["maquinas"];
 
 export function useMaquinas(search?: string) {
   const queryClient = useQueryClient();
 
   const query = useQuery({
     queryKey: search ? [...MAQUINAS_QUERY_KEY, { search }] : MAQUINAS_QUERY_KEY,
     queryFn: async () => {
       let q = supabase
         .from("maquinas")
         .select("*, clientes(nome_ponto, cidade)");
       
       if (search) {
         q = q.or(`codigo_identificacao.ilike.%${search}%,modelo.ilike.%${search}%`);
       }
       
       const { data, error } = await q.order("codigo_identificacao");
       if (error) throw error;
       
       // Filter by cliente name client-side if needed since cross-table or is tricky in Supabase
       let result = data as Maquina[];
       if (search) {
         const s = search.toLowerCase();
         result = result.filter(m => 
           m.codigo_identificacao.toLowerCase().includes(s) ||
           (m.modelo || "").toLowerCase().includes(s) ||
           (m.clientes?.nome_ponto || "").toLowerCase().includes(s)
         );
       }
       
       return result;
     },
   });
 
   const createMutation = useMutation({
     mutationFn: async (newMaquina: NewMaquina) => {
       const { data, error } = await supabase.from("maquinas").insert(newMaquina).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: MAQUINAS_QUERY_KEY });
     },
   });
 
   const updateMutation = useMutation({
     mutationFn: async ({ id, ...changes }: UpdateMaquina & { id: string }) => {
       const { data, error } = await supabase.from("maquinas").update(changes).eq("id", id).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: MAQUINAS_QUERY_KEY });
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("maquinas").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: MAQUINAS_QUERY_KEY });
     },
   });
 
   return {
     maquinas: query.data || [],
     loading: query.isLoading,
     error: query.error,
     createMaquina: createMutation.mutateAsync,
     updateMaquina: updateMutation.mutateAsync,
     deleteMaquina: deleteMutation.mutateAsync,
     isCreating: createMutation.isPending,
     isUpdating: updateMutation.isPending,
     isDeleting: deleteMutation.isPending,
   };
 }