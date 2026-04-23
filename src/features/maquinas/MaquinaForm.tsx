import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { useAuth, canManageData } from "@/contexts/AuthContext";
import { z } from "zod";

const schema = z.object({
  codigo_identificacao: z.string().trim().min(1).max(100),
  modelo: z.string().optional(),
  cliente_id: z.string().uuid("Selecione um cliente"),
  data_instalacao: z.string().optional(),
  status: z.enum(["ativa", "manutencao", "removida", "desativada"]),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function MaquinaForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isEdit = !!id;
  const [form, setForm] = useState<FormData>({
    codigo_identificacao: "",
    modelo: "",
    cliente_id: searchParams.get("cliente") || "",
    data_instalacao: "",
    status: "ativa",
    observacoes: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canManageData(role)) {
      toast.error("Sem permissão");
      navigate("/maquinas");
    }
  }, [role, navigate]);

  useEffect(() => {
    supabase.from("clientes").select("id, nome_ponto, cidade").eq("ativo", true).order("nome_ponto").then(({ data }) => {
      setClientes(data || []);
    });
    if (isEdit) {
      supabase.from("maquinas").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
        if (error || !data) {
          toast.error("Máquina não encontrada");
          navigate("/maquinas");
          return;
        }
        setForm({
          codigo_identificacao: data.codigo_identificacao,
          modelo: data.modelo || "",
          cliente_id: data.cliente_id,
          data_instalacao: data.data_instalacao || "",
          status: data.status,
          observacoes: data.observacoes || "",
        });
        setLoading(false);
      });
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Dados inválidos");
      return;
    }
    setSaving(true);
    try {
      const dbPayload = {
        ...parsed.data,
        modelo: parsed.data.modelo || null,
        observacoes: parsed.data.observacoes || null,
        data_instalacao: parsed.data.data_instalacao || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("maquinas").update(dbPayload).eq("id", id);
        if (error) throw error;
        await logAudit({ acao: "UPDATE_MAQUINA", tabela: "maquinas", registro_id: id, dados_depois: dbPayload });
        toast.success("Máquina atualizada");
      } else {
        const { data, error } = await supabase.from("maquinas").insert(dbPayload).select("id").single();
        if (error) throw error;
        await logAudit({ acao: "CREATE_MAQUINA", tabela: "maquinas", registro_id: data.id, dados_depois: dbPayload });
        toast.success("Máquina cadastrada");
      }
      navigate("/maquinas");
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
      <PageHeader title={isEdit ? "Editar máquina" : "Nova máquina"} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-5 space-y-4 bg-card">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código de identificação *</Label>
              <Input
                value={form.codigo_identificacao}
                onChange={(e) => setForm({ ...form, codigo_identificacao: e.target.value })}
                placeholder="MAQ-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cliente (ponto) *</Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_ponto} • {c.cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de instalação</Label>
              <Input type="date" value={form.data_instalacao} onChange={(e) => setForm({ ...form, data_instalacao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: FormData["status"]) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="manutencao">Em manutenção</SelectItem>
                  <SelectItem value="removida">Removida</SelectItem>
                  <SelectItem value="desativada">Desativada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
          </div>
        </Card>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="flex-1">Cancelar</Button>
          <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}