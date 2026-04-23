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
      const { data } = await supabase
        .from("clientes")
        .select("id, nome_ponto, nome_responsavel, telefone_responsavel, cidade, estado, percentual_comissao, ativo")
        .order("nome_ponto");
      setClientes(data || []);
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
