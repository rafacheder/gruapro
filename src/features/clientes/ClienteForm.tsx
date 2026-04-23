import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { maskCEP, maskPhone, onlyDigits } from "@/lib/format";
import { buscarCEP } from "@/lib/viacep";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { useAuth, canManageData } from "@/contexts/AuthContext";

const schema = z.object({
  nome_ponto: z.string().trim().min(1, "Obrigatório").max(200),
  nome_responsavel: z.string().trim().min(1, "Obrigatório").max(200),
  telefone_responsavel: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cep: z.string().min(8, "CEP inválido"),
  rua: z.string().trim().min(1, "Obrigatório"),
  numero: z.string().trim().min(1, "Obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().trim().min(1, "Obrigatório"),
  cidade: z.string().trim().min(1, "Obrigatório"),
  estado: z.string().length(2, "UF de 2 letras"),
  percentual_comissao: z.number().min(0).max(100),
  data_inicio_contrato: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const empty: FormData = {
  nome_ponto: "",
  nome_responsavel: "",
  telefone_responsavel: "",
  email: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  percentual_comissao: 30,
  data_inicio_contrato: "",
  observacoes: "",
  ativo: true,
};

export default function ClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isEdit = !!id;
  const [form, setForm] = useState<FormData>(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (!canManageData(role)) {
      toast.error("Sem permissão");
      navigate("/clientes");
    }
  }, [role, navigate]);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data, error } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast.error("Cliente não encontrado");
        navigate("/clientes");
        return;
      }
      setForm({
        nome_ponto: data.nome_ponto,
        nome_responsavel: data.nome_responsavel,
        telefone_responsavel: maskPhone(data.telefone_responsavel),
        email: data.email || "",
        cep: maskCEP(data.cep),
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento || "",
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        percentual_comissao: Number(data.percentual_comissao),
        data_inicio_contrato: data.data_inicio_contrato || "",
        observacoes: data.observacoes || "",
        ativo: data.ativo,
      });
      setLoading(false);
    };
    load();
  }, [id, isEdit, navigate]);

  const handleCEP = async (value: string) => {
    const masked = maskCEP(value);
    setForm((f) => ({ ...f, cep: masked }));
    if (onlyDigits(masked).length === 8) {
      setCepLoading(true);
      const data = await buscarCEP(masked);
      setCepLoading(false);
      if (data) {
        setForm((f) => ({
          ...f,
          rua: data.logradouro || f.rua,
          bairro: data.bairro || f.bairro,
          cidade: data.localidade || f.cidade,
          estado: data.uf || f.estado,
        }));
        toast.success("Endereço preenchido");
      } else {
        toast.warning("CEP não encontrado — preencha manualmente");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      telefone_responsavel: onlyDigits(form.telefone_responsavel),
      cep: onlyDigits(form.cep),
      estado: form.estado.toUpperCase(),
      email: form.email || undefined,
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Dados inválidos");
      return;
    }
    setSaving(true);
    try {
      const dbPayload = {
        ...parsed.data,
        email: parsed.data.email || null,
        complemento: parsed.data.complemento || null,
        observacoes: parsed.data.observacoes || null,
        data_inicio_contrato: parsed.data.data_inicio_contrato || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("clientes").update(dbPayload).eq("id", id);
        if (error) throw error;
        await logAudit({ acao: "UPDATE_CLIENTE", tabela: "clientes", registro_id: id, dados_depois: dbPayload });
        toast.success("Cliente atualizado");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("clientes")
          .insert({ ...dbPayload, created_by: user?.id })
          .select("id")
          .single();
        if (error) throw error;
        await logAudit({ acao: "CREATE_CLIENTE", tabela: "clientes", registro_id: data.id, dados_depois: dbPayload });
        toast.success("Cliente cadastrado");
      }
      navigate("/clientes");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>
      <PageHeader title={isEdit ? "Editar cliente" : "Novo cliente"} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-5 space-y-4 bg-card">
          <h3 className="font-semibold">Dados do ponto</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do ponto *</Label>
              <Input value={form.nome_ponto} onChange={(e) => setForm({ ...form, nome_ponto: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Responsável *</Label>
              <Input value={form.nome_responsavel} onChange={(e) => setForm({ ...form, nome_responsavel: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input
                value={form.telefone_responsavel}
                onChange={(e) => setForm({ ...form, telefone_responsavel: maskPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4 bg-card">
          <h3 className="font-semibold">Endereço</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CEP * {cepLoading && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</Label>
              <Input value={form.cep} onChange={(e) => handleCEP(e.target.value)} placeholder="00000-000" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Rua *</Label>
              <Input value={form.rua} onChange={(e) => setForm({ ...form, rua: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Número *</Label>
              <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Bairro *</Label>
              <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cidade *</Label>
              <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>UF *</Label>
              <Input
                maxLength={2}
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4 bg-card">
          <h3 className="font-semibold">Comercial</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Percentual de comissão (%) *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.percentual_comissao}
                onChange={(e) => setForm({ ...form, percentual_comissao: Number(e.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground">% do faturamento que vai para o ponto</p>
            </div>
            <div className="space-y-2">
              <Label>Início do contrato</Label>
              <Input type="date" value={form.data_inicio_contrato} onChange={(e) => setForm({ ...form, data_inicio_contrato: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
            <Label>Cliente ativo</Label>
          </div>
        </Card>

        <div className="flex gap-3 sticky bottom-20 md:bottom-0">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}