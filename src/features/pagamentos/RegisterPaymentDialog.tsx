import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { logAudit } from "@/lib/audit";

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type FormData = {
  cliente_id: string;
  valor: string;
  data_pagamento: string;
  forma_pagamento: "dinheiro" | "pix" | "transferencia" | "outro";
  observacoes: string;
};

export default function RegisterPaymentDialog({
  open,
  onOpenChange,
  onSuccess,
}: RegisterPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nome_ponto: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<FormData>({
    defaultValues: {
      cliente_id: "",
      valor: "",
      data_pagamento: new Date().toISOString().slice(0, 16),
      forma_pagamento: "pix",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (open) {
      loadClientes();
      form.reset({
        cliente_id: "",
        valor: "",
        data_pagamento: new Date().toISOString().slice(0, 16),
        forma_pagamento: "pix",
        observacoes: "",
      });
      setFile(null);
    }
  }, [open]);

  async function loadClientes() {
    const { data } = await supabase
      .from("clientes")
      .select("id, nome_ponto")
      .eq("ativo", true)
      .order("nome_ponto");
    setClientes(data || []);
  }

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let comprovante_url = null;
      if (file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("comprovantes-pagamento")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        comprovante_url = filePath;
      }

      const payload = {
        cliente_id: values.cliente_id,
        valor: parseFloat(values.valor.replace(",", ".")),
        data_pagamento: new Date(values.data_pagamento).toISOString(),
        forma_pagamento: values.forma_pagamento,
        observacoes: values.observacoes,
        comprovante_url,
        registrado_por: user.id,
      };

      const { data, error } = await supabase
        .from("pagamentos")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      await logAudit({
        acao: "CREATE",
        tabela: "pagamentos",
        registro_id: data.id,
        dados_depois: data,
      });

      toast.success("Pagamento registrado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao registrar pagamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome_ponto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="forma_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="data_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data/Hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Comprovante (opcional)</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
            </FormItem>
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Opcional..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Pagamento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
