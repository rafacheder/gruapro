import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Cliente {
  id: string;
  nome_ponto: string;
  nome_responsavel: string;
  telefone_responsavel: string;
  cidade: string;
  estado: string;
  percentual_comissao: number;
  ativo: boolean;
}

export function useClientes(search: string) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
     const load = async () => {
       setLoading(true);
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
 
       const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: user.id });
       const isOperator = roleData === 'usuario';
 
       // @ts-ignore
       const table: any = isOperator ? "clientes_operador" : "clientes";
       const columns = isOperator 
         ? "id, nome_ponto, nome_responsavel, telefone_responsavel, cidade, estado, ativo"
         : "id, nome_ponto, nome_responsavel, telefone_responsavel, cidade, estado, percentual_comissao, ativo";
 
       const { data } = await supabase
         .from(table)
         .select(columns)
         .order("nome_ponto");
 
       if (data) {
         const mapped = data.map((c: any) => ({
           ...c,
           percentual_comissao: c.percentual_comissao || 0
         }));
         setClientes(mapped as Cliente[]);
       }
       setLoading(false);
     };
     load();
   }, []);

  const filtered = clientes.filter((c) => {
    const s = search.toLowerCase();
    return (
      !s ||
      c.nome_ponto.toLowerCase().includes(s) ||
      c.nome_responsavel.toLowerCase().includes(s) ||
      c.cidade.toLowerCase().includes(s) ||
      c.telefone_responsavel.includes(s)
    );
  });

  return { clientes: filtered, loading };
}
