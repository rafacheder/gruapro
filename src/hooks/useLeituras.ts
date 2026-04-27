 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Database } from "@/integrations/supabase/types";
 import { endOfDay } from "date-fns";
 
 export const LEITURAS_QUERY_KEY = ["leituras"];
 
 interface LeiturasFilters {
   clienteId?: string;
   maquinaId?: string;
   status?: string;
   operadorId?: string;
   startDate?: Date;
   endDate?: Date;
 }
 
 export function useLeituras(filters?: LeiturasFilters) {
   const queryClient = useQueryClient();
 
   const query = useQuery({
     queryKey: filters ? [...LEITURAS_QUERY_KEY, filters] : LEITURAS_QUERY_KEY,
     queryFn: async () => {
       let q = supabase.from("vw_leituras_com_anterior").select("*", { count: 'exact' });
 
       if (filters?.clienteId) q = q.eq("cliente_id", filters.clienteId);
       if (filters?.maquinaId) q = q.eq("maquina_id", filters.maquinaId);
       if (filters?.status && filters.status !== "all") q = q.eq("status", filters.status);
       if (filters?.operadorId && filters.operadorId !== "all") q = q.eq("usuario_id", filters.operadorId);
       if (filters?.startDate) q = q.gte("data_leitura", filters.startDate.toISOString());
       if (filters?.endDate) q = q.lte("data_leitura", endOfDay(filters.endDate).toISOString());
 
       const { data, error } = await q.order("data_leitura", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
 
   const createMutation = useMutation({
     mutationFn: async (newLeitura: Database["public"]["Tables"]["leituras"]["Insert"]) => {
       const { data, error } = await supabase.from("leituras").insert(newLeitura).select().single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: LEITURAS_QUERY_KEY });
     },
   });
 
   return {
     leituras: query.data || [],
     loading: query.isLoading,
     error: query.error,
     createLeitura: createMutation.mutateAsync,
     isCreating: createMutation.isPending,
   };
 }