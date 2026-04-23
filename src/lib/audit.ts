import { supabase } from "@/integrations/supabase/client";

export async function logAudit(params: {
  acao: string;
  tabela: string;
  registro_id?: string | null;
  dados_antes?: unknown;
  dados_depois?: unknown;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_log").insert({
    usuario_id: user.id,
    acao: params.acao,
    tabela: params.tabela,
    registro_id: params.registro_id ?? null,
    dados_antes: (params.dados_antes ?? null) as never,
    dados_depois: (params.dados_depois ?? null) as never,
  });
}