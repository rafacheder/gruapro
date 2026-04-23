export interface ViaCEPResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export async function buscarCEP(cep: string): Promise<ViaCEPResponse | null> {
  const clean = (cep || "").replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCEPResponse;
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}