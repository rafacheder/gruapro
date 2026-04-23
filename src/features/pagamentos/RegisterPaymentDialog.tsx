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
   FormDescription,
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
 import { Checkbox } from "@/components/ui/checkbox";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
 import { Loader2, Calendar } from "lucide-react";
import { logAudit } from "@/lib/audit";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
    initialLeituraIds?: string[];
   initialClienteId?: string;
}

type FormData = {
  cliente_id: string;
  valor: string;
  data_pagamento: string;
  forma_pagamento: "dinheiro" | "pix" | "transferencia" | "outro";
  observacoes: string;
   avulso: boolean;
};

 interface PendingLeitura {
   id: string;
   data_leitura: string;
   valor_comissao: number;
   maquinas: {
     codigo_identificacao: string;
   } | null;
 }
 
export default function RegisterPaymentDialog({
  open,
  onOpenChange,
  onSuccess,
    initialLeituraIds,
   initialClienteId,
}: RegisterPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nome_ponto: string }[]>([]);
   const [pendingLeituras, setPendingLeituras] = useState<PendingLeitura[]>([]);
   const [selectedLeituras, setSelectedLeituras] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
   const [loadingLeituras, setLoadingLeituras] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
       cliente_id: initialClienteId || "",
      valor: "",
      data_pagamento: new Date().toISOString().slice(0, 16),
      forma_pagamento: "pix",
      observacoes: "",
       avulso: false,
    },
  });

   const clienteId = form.watch("cliente_id");
   const isAvulso = form.watch("avulso");
 
  useEffect(() => {
    if (open) {
      loadClientes();
      form.reset({
         cliente_id: initialClienteId || "",
        valor: "",
        data_pagamento: new Date().toISOString().slice(0, 16),
        forma_pagamento: "pix",
        observacoes: "",
         avulso: false,
      });
      setFile(null);
       setSelectedLeituras(initialLeituraIds || []);
       if (initialClienteId) {
         loadPendingLeituras(initialClienteId);
       } else {
         setPendingLeituras([]);
       }
    }
    }, [open, initialLeituraIds, initialClienteId]);
 
   useEffect(() => {
     if (clienteId) {
       loadPendingLeituras(clienteId);
     } else {
       setPendingLeituras([]);
       setSelectedLeituras([]);
     }
   }, [clienteId]);
 
   useEffect(() => {
     if (!isAvulso) {
       const total = pendingLeituras
         .filter(l => selectedLeituras.includes(l.id))
         .reduce((acc, curr) => acc + curr.valor_comissao, 0);
       
       if (total > 0) {
         form.setValue("valor", total.toFixed(2).replace(".", ","));
       }
     }
   }, [selectedLeituras, pendingLeituras, isAvulso]);

  async function loadClientes() {
    const { data } = await supabase
      .from("clientes")
      .select("id, nome_ponto")
      .eq("ativo", true)
      .order("nome_ponto");
    setClientes(data || []);
  }

   async function loadPendingLeituras(cid: string) {
     setLoadingLeituras(true);
     try {
       const { data, error } = await supabase
         .from("leituras")
         .select("id, data_leitura, valor_comissao, maquinas(codigo_identificacao)")
         .eq("cliente_id", cid)
         .eq("status", "pendente")
         .order("data_leitura", { ascending: true });
       if (error) throw error;
       setPendingLeituras((data as any[]) || []);
     } finally {
       setLoadingLeituras(false);
     }
   }
 
  const onSubmit = async (values: FormData) => {
    try {
       if (!values.avulso && selectedLeituras.length === 0) {
         toast.error("Selecione pelo menos uma leitura ou marque como pagamento avulso");
         return;
       }
 
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

       const valorNum = parseFloat(values.valor.replace(",", "."));
 
       const { data: pagamento, error: pagError } = await supabase
         .from("pagamentos")
         .insert({
        cliente_id: values.cliente_id,
         valor: valorNum,
        data_pagamento: new Date(values.data_pagamento).toISOString(),
        forma_pagamento: values.forma_pagamento,
        observacoes: values.observacoes,
        comprovante_url,
        registrado_por: user.id,
       })
         .select()
         .single();
 
       if (pagError) throw pagError;
 
       if (!values.avulso && selectedLeituras.length > 0) {
         const links = selectedLeituras.map(lid => {
           const leitura = pendingLeituras.find(l => l.id === lid);
           return {
             pagamento_id: pagamento.id,
             leitura_id: lid,
             valor_aplicado: leitura?.valor_comissao || 0,
           };
         });
 
         const { error: linkError } = await supabase
           .from("pagamento_leituras")
           .insert(links);
         
         if (linkError) throw linkError;
 
         const { error: statusError } = await supabase
           .from("leituras")
           .update({ status: "pago" })
           .in("id", selectedLeituras);
         
         if (statusError) throw statusError;
       }
 
      await logAudit({
        acao: "CREATE",
        tabela: "pagamentos",
         registro_id: pagamento.id,
         dados_depois: pagamento,
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
       <DialogContent className="sm:max-w-[500px]">
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
 
             {clienteId && (
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <FormLabel className="text-sm font-medium">Leituras Pendentes</FormLabel>
                   <FormField
                     control={form.control}
                     name="avulso"
                     render={({ field }) => (
                       <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                         <FormControl>
                           <Checkbox
                             checked={field.value}
                             onCheckedChange={field.onChange}
                           />
                         </FormControl>
                         <FormLabel className="text-xs font-normal cursor-pointer">
                           Pagamento avulso
                         </FormLabel>
                       </FormItem>
                     )}
                   />
                 </div>
                 
                 {!isAvulso && (
                   <ScrollArea className="h-[150px] w-full rounded-md border p-2">
                     {loadingLeituras ? (
                       <div className="flex items-center justify-center h-full">
                         <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                       </div>
                     ) : pendingLeituras.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
                         <p>Nenhuma leitura pendente.</p>
                       </div>
                     ) : (
                       <div className="space-y-2">
                         {pendingLeituras.map((l) => (
                           <div key={l.id} className="flex items-center space-x-2 hover:bg-accent/50 p-1 rounded transition-colors">
                             <Checkbox 
                               id={`leitura-${l.id}`}
                               checked={selectedLeituras.includes(l.id)}
                               onCheckedChange={(checked) => {
                                 if (checked) {
                                   setSelectedLeituras([...selectedLeituras, l.id]);
                                 } else {
                                   setSelectedLeituras(selectedLeituras.filter(id => id !== l.id));
                                 }
                               }}
                             />
                             <label 
                               htmlFor={`leitura-${l.id}`}
                               className="flex-1 text-xs cursor-pointer flex justify-between items-center"
                             >
                               <span className="flex items-center gap-2">
                                 <Calendar className="h-3 w-3 text-muted-foreground" />
                                 {format(new Date(l.data_leitura), "dd/MM/yyyy", { locale: ptBR })}
                                 <Badge variant="outline" className="text-[10px] py-0 h-4">
                                   {l.maquinas?.codigo_identificacao || "N/A"}
                                 </Badge>
                               </span>
                               <span className="font-semibold text-accent">
                                 R$ {l.valor_comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                               </span>
                             </label>
                           </div>
                         ))}
                       </div>
                     )}
                   </ScrollArea>
                 )}
               </div>
             )}
             <Separator />
 
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
