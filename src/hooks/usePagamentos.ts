 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Database } from "@/integrations/supabase/types";
 
 export const PAGAMENTOS_QUERY_KEY = ["pagamentos"];
 
 export function usePagamentos(clienteId?: string) {
   const queryClient = useQueryClient();
 
   const query = useQuery({
     queryKey: clienteId ? [...PAGAMENTOS_QUERY_KEY, { clienteId }] : PAGAMENTOS_QUERY_KEY,
     queryFn: async () => {
       let q = supabase
         .from("pagamentos")
         .select("*, clientes(nome_ponto)");
       
       if (clienteId) q = q.eq("cliente_id", clienteId);
       
       const { data, error } = await q.order("data_pagamento", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
 
   const createMutation = useMutation({
     mutationFn: async (newPagamento: Database["public"]["Tables"]["pagamentos"]["Insert"]) => {
       const { data, error } = await supabase.from("pagamentos").insert(newPagamento).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: PAGAMENTOS_QUERY_KEY });
       queryClient.invalidateQueries({ queryKey: ["leituras"] });
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("pagamentos").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: PAGAMENTOS_QUERY_KEY });
       queryClient.invalidateQueries({ queryKey: ["leituras"] });
     },
   });
 
   return {
     pagamentos: query.data || [],
     loading: query.isLoading,
     error: query.error,
     createPagamento: createMutation.mutateAsync,
     deletePagamento: deleteMutation.mutateAsync,
     isCreating: createMutation.isPending,
     isDeleting: deleteMutation.isPending,
   };
 }