// Formatadores pt-BR
export const formatBRL = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));

export const formatNumber = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR").format(Number(v || 0));

export const formatPercent = (v: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v) + "%";

export const formatDateTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));

export const formatDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));

export const maskPhone = (v: string) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, a, b, c) => {
      let r = "";
      if (a) r += `(${a}`;
      if (a && a.length === 2) r += ") ";
      if (b) r += b;
      if (c) r += `-${c}`;
      return r;
    });
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
};

export const maskCEP = (v: string) => {
  const d = (v || "").replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

export const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");

export const round2 = (v: number) => Math.round(v * 100) / 100;

export const calcComissao = (faturamento: number, percentual: number) => {
  const comissao = round2(faturamento * (percentual / 100));
  const liquido = round2(faturamento - comissao);
  return { comissao, liquido };
};