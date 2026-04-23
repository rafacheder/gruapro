 import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
 import { ArrowLeft, Camera, Loader2, X, AlertTriangle, QrCode, CloudOff, Info, TrendingDown, CheckCircle2 } from "lucide-react";
 import { Html5QrcodeScanner } from "html5-qrcode";
import { calcComissao, formatBRL } from "@/lib/format";
import { calcularVariacao, type VariacaoLeitura } from "@/utils/reading-calculations";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logAudit } from "@/lib/audit";
 import { useAuth } from "@/contexts/AuthContext";
 import { useOnlineStatus } from "@/hooks/use-online-status";
 import { saveOfflineLeitura } from "@/services/sync-service";

interface MaquinaOpt {
  id: string;
  codigo_identificacao: string;
  cliente_id: string;
  clientes: { nome_ponto: string; percentual_comissao: number };
}

async function compressImage(file: File, maxWidth = 1600, quality = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality));
}

 export default function NovaLeitura() {
   const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [maquinas, setMaquinas] = useState<MaquinaOpt[]>([]);
   const maquinaIdParam = searchParams.get("maquina_id") || searchParams.get("maquina");
   const [maquinaId, setMaquinaId] = useState(maquinaIdParam || "");
   const [isScanning, setIsScanning] = useState(false);
   const scannerRef = useRef<Html5QrcodeScanner | null>(null);
   const [contadorEntradaAtual, setContadorEntradaAtual] = useState("");
   const [contadorSaidaAtual, setContadorSaidaAtual] = useState("");
   const [valorPorCredito, setValorPorCredito] = useState("1,00");
  const [observacoes, setObservacoes] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [ultimaLeitura, setUltimaLeitura] = useState<any | null>(null);
  const [variacao, setVariacao] = useState<VariacaoLeitura | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentClienteId, setCurrentClienteId] = useState<string | null>(null);
  const [leiturasRealizadas, setLeiturasRealizadas] = useState<string[]>([]);
  const [isSubmitNext, setIsSubmitNext] = useState(false);

   useEffect(() => {
     let timer: any;
     if (isScanning && !scannerRef.current) {
       timer = setTimeout(() => {
         const scanner = new Html5QrcodeScanner(
           "qr-reader",
           { fps: 10, qrbox: { width: 250, height: 250 } },
           /* verbose= */ false
         );
         scannerRef.current = scanner;
         scanner.render(onScanSuccess, onScanFailure);
       }, 100);
     }
     return () => {
       if (timer) clearTimeout(timer);
       if (scannerRef.current) {
         scannerRef.current.clear().catch(err => console.error("Error clearing scanner", err));
         scannerRef.current = null;
       }
     };
   }, [isScanning]);
 
   async function onScanSuccess(decodedText: string) {
     try {
       const url = new URL(decodedText);
       const mid = url.searchParams.get("maquina_id");
       if (mid) {
         await handleSelectMachine(mid);
       } else {
         toast.error("QR Code inválido para este sistema");
       }
     } catch (e) {
       toast.error("QR Code não contém uma URL válida");
     }
   }
 
   function onScanFailure() { }
 
   const handleSelectMachine = async (id: string) => {
      const { data: maquinaData, error } = await supabase
       .from("maquinas")
        .select("id, status, cliente_id")
       .eq("id", id)
       .maybeSingle();
 
      if (error || !maquinaData) {
       toast.error("Máquina não encontrada");
       return;
     }
 
      if (maquinaData.status !== "ativa") {
        toast.error(`Máquina está com status: ${maquinaData.status}`);
       return;
     }
 
      setMaquinaId(id);
      setCurrentClienteId(maquinaData.cliente_id);

     setIsScanning(false);
     toast.success("Máquina selecionada via QR Code!");
   };
 
  useEffect(() => {
    // If maquina_id is provided in URL, validate it
    if (maquinaIdParam) {
      supabase
        .from("maquinas")
        .select("id, status")
        .eq("id", maquinaIdParam)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error || !data) {
            toast.error("Máquina não encontrada");
            setMaquinaId("");
          } else if (data.status !== "ativa") {
            toast.error(`Máquina está com status: ${data.status}`);
            setMaquinaId("");
          }
        });
    }

    supabase
      .from("maquinas")
      .select("id, codigo_identificacao, cliente_id, clientes(nome_ponto, percentual_comissao)")
      .eq("status", "ativa")
      .order("codigo_identificacao")
      .then(({ data }) => setMaquinas((data as unknown as MaquinaOpt[]) || []));
  }, []);

  useEffect(() => {
    if (!maquinaId) {
      setUltimaLeitura(null);
      return;
    }
     async function fetchLast() {
       const { data: maquina } = await supabase.from("maquinas").select("valor_por_credito, contador_entrada_inicial, contador_saida_inicial").eq("id", maquinaId).maybeSingle();
       if (maquina) {
         setValorPorCredito(maquina.valor_por_credito?.toString().replace(".", ",") || "1,00");
       }
       
       const { data } = await supabase
         .from("vw_leituras_com_anterior")
         .select("*")
         .eq("maquina_id", maquinaId)
         .order("data_leitura", { ascending: false })
         .limit(1)
         .maybeSingle();
         
       if (data) {
         setUltimaLeitura(data);
       } else if (maquina) {
         // Se não tem leitura, usa os contadores iniciais da máquina como baseline
         setUltimaLeitura({
           contador_entrada_atual: maquina.contador_entrada_inicial || 0,
           contador_saida_atual: maquina.contador_saida_inicial || 0,
           data_leitura: null, // indica que é baseline
           is_baseline: true
         });
       }
     }
     fetchLast();
  }, [maquinaId]);

   const maquinaSel = useMemo(() => maquinas.find((m) => m.id === maquinaId), [maquinas, maquinaId]);

   useEffect(() => {
     if (maquinaSel) {
       setCurrentClienteId(maquinaSel.cliente_id);
     }
   }, [maquinaSel]);

   const maquinasDoCliente = useMemo(() => {
     if (!currentClienteId) return [];
     return maquinas.filter(m => m.cliente_id === currentClienteId);
   }, [currentClienteId, maquinas]);

  const percentual = maquinaSel?.clientes?.percentual_comissao || 0;
  const valorNum = parseFloat(valorFaturado.replace(",", ".")) || 0;
  const { comissao, liquido } = useMemo(() => calcComissao(valorNum, percentual), [valorNum, percentual]);

  useEffect(() => {
    if (ultimaLeitura && valorNum >= 0) {
      const currentData = {
        valor_faturado: valorNum,
        pelucias_saidas: parseInt(pelucias) || 0,
        data_leitura: new Date().toISOString()
      };
      
      const v = calcularVariacao(currentData, {
        valor_faturado: Number(ultimaLeitura.valor_faturado),
        pelucias_saidas: Number(ultimaLeitura.pelucias_saidas),
        data_leitura: ultimaLeitura.data_leitura,
        data_leitura_previa: ultimaLeitura.data_leitura_previa
      });
      setVariacao(v);
    } else {
      setVariacao(null);
    }
  }, [ultimaLeitura, valorNum, pelucias]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const remaining = 5 - fotos.length;
    const accepted = list.slice(0, remaining);
    if (list.length > remaining) toast.warning(`Máximo de 5 fotos. ${remaining} aceita(s).`);
    setFotos((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFoto = (i: number) => {
    setFotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

    const resetForm = () => {
      setMaquinaId("");
      setValorFaturado("");
      setPelucias("");
      setObservacoes("");
      setFotos([]);
      setPreviews([]);
      setUltimaLeitura(null);
      setVariacao(null);
    };

    const handleSubmit = async (e?: React.FormEvent, proxima: boolean = false) => {
      if (e && (e as any).preventDefault) (e as any).preventDefault();
      if (!maquinaSel) { toast.error("Selecione uma máquina"); return; }
      if (valorNum < 0) { toast.error("Valor inválido"); return; }
      if (!user) { toast.error("Sessão expirada"); return; }

      if (variacao?.nivelAlerta === 'critico' && !showConfirm) {
        setIsSubmitNext(proxima);
        setShowConfirm(true);
        return;
      }

     setSaving(true);
     try {
       if (isOnline) {
         const { data: leitura, error } = await supabase
           .from("leituras")
           .insert({
             maquina_id: maquinaSel.id,
             cliente_id: maquinaSel.cliente_id,
             usuario_id: user.id,
             valor_faturado: valorNum,
             pelucias_saidas: parseInt(pelucias) || 0,
             valor_comissao: comissao,
             valor_liquido: liquido,
             percentual_aplicado: percentual,
             observacoes: observacoes || null,
             status: "pendente",
           })
           .select("id")
           .single();
         if (error) throw error;
 
         // Upload fotos
         for (let i = 0; i < fotos.length; i++) {
           const blob = await compressImage(fotos[i]);
           const path = `${leitura.id}/${i + 1}-${Date.now()}.jpg`;
           const { error: upErr } = await supabase.storage.from("leitura-fotos").upload(path, blob, { contentType: "image/jpeg" });
           if (upErr) { console.error(upErr); continue; }
           const { data: pub } = supabase.storage.from("leitura-fotos").getPublicUrl(path);
           await supabase.from("leitura_fotos").insert({
             leitura_id: leitura.id,
             foto_url: pub.publicUrl,
             ordem: i + 1,
           });
         }
 
         await logAudit({
           acao: "CREATE_LEITURA",
           tabela: "leituras",
           registro_id: leitura.id,
           dados_depois: { valor_faturado: valorNum, comissao, percentual },
         });
 
          toast.success(`Leitura de ${maquinaSel.codigo_identificacao} registrada!`);
          setLeiturasRealizadas(prev => [...prev, maquinaSel.id]);
          
          if (proxima) {
            resetForm();
          } else {
            navigate(`/leituras/${leitura.id}`);
          }
       } else {
         // Modo offline
         const fotosData = [];
         for (let i = 0; i < fotos.length; i++) {
           const blob = await compressImage(fotos[i]);
           fotosData.push({
             campo: `foto_${i + 1}`,
             blob,
             fileName: `${i + 1}-${Date.now()}.jpg`
           });
         }
 
         await saveOfflineLeitura({
           maquina_id: maquinaSel.id,
           cliente_id: maquinaSel.cliente_id,
           usuario_id: user.id,
           valor_faturado: valorNum,
           pelucias_saidas: parseInt(pelucias) || 0,
           valor_comissao: comissao,
           valor_liquido: liquido,
           percentual_comissao: percentual,
           observacoes: observacoes || undefined,
           data_leitura: new Date().toISOString(),
           leitura_anterior: 0, // Not used in insert but present in PendingLeitura
           leitura_atual: 0, // Not used in insert but present in PendingLeitura
         }, fotosData);
 
          toast.success(`Leitura de ${maquinaSel.codigo_identificacao} salva offline!`);
          setLeiturasRealizadas(prev => [...prev, maquinaSel.id]);
          
          if (proxima) {
            resetForm();
          } else {
            navigate("/leituras");
          }
       }
     } catch (err: unknown) {
       toast.error(err instanceof Error ? err.message : "Erro ao salvar");
     } finally {
       setSaving(false);
     }
   };

   const diasUltimaLeitura = ultimaLeitura ? differenceInDays(new Date(), parseISO(ultimaLeitura.data_leitura)) : 0;
   const faturamentoDiaAnterior = ultimaLeitura?.data_leitura_previa 
     ? ultimaLeitura.valor_faturado / Math.max(1, differenceInDays(parseISO(ultimaLeitura.data_leitura), parseISO(ultimaLeitura.data_leitura_previa)))
     : 0;

   return (
     <div>
       <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate(-1)}>
         <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
       </Button>
       <PageHeader title="Nova leitura" description="Coleta em campo" />

       {ultimaLeitura && (
          <Card className="p-4 mb-4 bg-secondary/30 border-secondary/50">
            <div className="flex items-center gap-2 mb-2 text-secondary-foreground font-medium text-sm">
             <Info className="h-4 w-4" />
             📊 Última leitura: {format(parseISO(ultimaLeitura.data_leitura), "dd/MM/yyyy")} (há {diasUltimaLeitura} dias)
           </div>
            <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2">
             <div>Faturamento: <span className="font-semibold">{formatBRL(ultimaLeitura.valor_faturado)}</span></div>
             <div>Pelúcias: <span className="font-semibold">{ultimaLeitura.pelucias_saidas}</span></div>
             <div>{formatBRL(faturamentoDiaAnterior)}/dia</div>
           </div>
         </Card>
       )}
 
       <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-5 space-y-4 bg-card">
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <Label>Máquina *</Label>
               <Button
                 type="button"
                 variant={isScanning ? "destructive" : "default"}
                 className={!isScanning ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                 size="sm"
                 onClick={() => setIsScanning(!isScanning)}
               >
                 {isScanning ? <X className="h-4 w-4 mr-2" /> : <QrCode className="h-4 w-4 mr-2" />}
                 {isScanning ? "Fechar scanner" : "Escanear QR Code"}
               </Button>
             </div>
 
             {isScanning && (
               <div className="relative overflow-hidden rounded-lg border-2 border-accent mb-4">
                 <div id="qr-reader" className="w-full" />
               </div>
             )}
 
               <Select value={maquinaId} onValueChange={(val) => {
                 setMaquinaId(val);
                 const m = maquinas.find(x => x.id === val);
                 if (m) setCurrentClienteId(m.cliente_id);
               }}>
                 <SelectTrigger><SelectValue placeholder="Selecione a máquina..." /></SelectTrigger>
              <SelectContent>
                {maquinas.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.codigo_identificacao} • {m.clientes?.nome_ponto}
                  </SelectItem>
                ))}
              </SelectContent>
             </Select>

             {maquinasDoCliente.length > 1 && (
               <div className="mt-4 pt-4 border-t border-border">
                 <Label className="text-xs uppercase text-muted-foreground mb-2 block">
                   Máquinas deste cliente ({leiturasRealizadas.filter(id => maquinasDoCliente.some(m => m.id === id)).length}/{maquinasDoCliente.length})
                 </Label>
                 <div className="flex flex-wrap gap-2">
                   {maquinasDoCliente.map(m => {
                     const jaLida = leiturasRealizadas.includes(m.id);
                     const isSelected = maquinaId === m.id;
                     return (
                       <Button
                         key={m.id}
                         type="button"
                         variant={isSelected ? "default" : "outline"}
                         size="sm"
                         className={`h-auto py-1 px-3 text-xs ${jaLida && !isSelected ? 'opacity-60 grayscale border-success/20 bg-success/10 text-success-foreground' : ''}`}
                         onClick={() => {
                           setMaquinaId(m.id);
                           if (jaLida) toast.info("Esta máquina já foi registrada nesta sessão.");
                         }}
                       >
                         {jaLida && <CheckCircle2 className="h-3 w-3 mr-1 text-success" />}
                         {m.codigo_identificacao}
                       </Button>
                     );
                   })}
                 </div>
               </div>
             )}
          </div>
        </Card>

        <Card className="p-5 space-y-4 bg-card">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor faturado (R$) *</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={valorFaturado}
                onChange={(e) => setValorFaturado(e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Pelúcias saídas</Label>
              <Input
                type="number"
                min="0"
                value={pelucias}
                onChange={(e) => setPelucias(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {variacao && variacao.nivelAlerta !== 'normal' && (
            <div className={`flex items-start gap-2 p-3 rounded-md border ${
              variacao.nivelAlerta === 'critico' 
                ? 'bg-destructive/15 border-destructive/30 text-destructive' 
                : 'bg-warning/15 border-warning/30 text-warning'
            }`}>
              <TrendingDown className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-medium">
                  {variacao.nivelAlerta === 'critico' ? '⚠️ Queda crítica detectada!' : 'Atenção: Queda detectada'}
                </div>
                <div className="opacity-90">
                  Queda de {Math.abs(Math.round(variacao.variacaoDiaria))}% no faturamento médio diário.
                </div>
              </div>
            </div>
          )}

          {maquinaSel && (
            <div className="rounded-md bg-gradient-primary p-4 text-primary-foreground space-y-2">
              <div className="flex justify-between text-sm">
                <span>Faturamento</span>
                <span className="font-semibold">{formatBRL(valorNum)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Comissão do ponto ({percentual}%)</span>
                <span className="font-semibold text-accent-glow">{formatBRL(comissao)}</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2 text-base">
                <span className="font-medium">Líquido p/ empresa</span>
                <span className="font-bold">{formatBRL(liquido)}</span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <Label>Fotos ({fotos.length}/5)</Label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={fotos.length >= 5}
            >
              <Camera className="h-4 w-4 mr-2" /> Adicionar
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
          </div>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-border">
                  <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFoto(i)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 bg-card">
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={saving || !maquinaId}
              onClick={() => handleSubmit(undefined, true)}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar e Próxima
            </Button>
            <Button
              type="submit"
              disabled={saving || !maquinaId}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar e Finalizar
            </Button>
          </div>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="w-full">Cancelar</Button>
        </div>
      </form>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Queda Crítica</AlertDialogTitle>
            <AlertDialogDescription>
              Esta leitura representa uma queda de {Math.abs(Math.round(variacao?.variacaoDiaria || 0))}% em relação ao faturamento médio diário da leitura anterior. 
              Confirma os valores digitados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar valores</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowConfirm(false);
              handleSubmit(undefined, isSubmitNext);
            }}>
              Confirmar e salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}