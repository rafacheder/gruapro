import { useEffect, useMemo, useRef, useState } from "react";
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
 import { ArrowLeft, Camera, Loader2, X, AlertTriangle, QrCode } from "lucide-react";
 import { Html5QrcodeScanner } from "html5-qrcode";
import { calcComissao, formatBRL } from "@/lib/format";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [maquinas, setMaquinas] = useState<MaquinaOpt[]>([]);
   const maquinaIdParam = searchParams.get("maquina_id") || searchParams.get("maquina");
   const [maquinaId, setMaquinaId] = useState(maquinaIdParam || "");
   const [isScanning, setIsScanning] = useState(false);
   const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [valorFaturado, setValorFaturado] = useState("");
  const [pelucias, setPelucias] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [mediaAnterior, setMediaAnterior] = useState<number | null>(null);

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
     const { data: maquina, error } = await supabase
       .from("maquinas")
       .select("id, status")
       .eq("id", id)
       .maybeSingle();
 
     if (error || !maquina) {
       toast.error("Máquina não encontrada");
       return;
     }
 
     if (maquina.status !== "ativa") {
       toast.error(`Máquina está com status: ${maquina.status}`);
       return;
     }
 
     setMaquinaId(id);
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
    if (!maquinaId) { setMediaAnterior(null); return; }
    supabase
      .from("leituras")
      .select("valor_faturado")
      .eq("maquina_id", maquinaId)
      .order("data_leitura", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const m = data.reduce((s, r) => s + Number(r.valor_faturado), 0) / data.length;
          setMediaAnterior(m);
        } else setMediaAnterior(null);
      });
  }, [maquinaId]);

  const maquinaSel = maquinas.find((m) => m.id === maquinaId);
  const percentual = maquinaSel?.clientes?.percentual_comissao || 0;
  const valorNum = parseFloat(valorFaturado.replace(",", ".")) || 0;
  const { comissao, liquido } = useMemo(() => calcComissao(valorNum, percentual), [valorNum, percentual]);

  const alertaQueda = mediaAnterior && valorNum > 0 && valorNum < mediaAnterior * 0.7;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maquinaSel) { toast.error("Selecione uma máquina"); return; }
    if (valorNum < 0) { toast.error("Valor inválido"); return; }
    if (!user) { toast.error("Sessão expirada"); return; }

    setSaving(true);
    try {
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
          status: "pendente_pagamento",
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

      toast.success("Leitura registrada!");
      navigate(`/leituras/${leitura.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>
      <PageHeader title="Nova leitura" description="Coleta em campo" />

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
 
             <Select value={maquinaId} onValueChange={setMaquinaId}>
              <SelectTrigger><SelectValue placeholder="Selecione a máquina..." /></SelectTrigger>
              <SelectContent>
                {maquinas.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.codigo_identificacao} • {m.clientes?.nome_ponto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {alertaQueda && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-warning/15 border border-warning/30">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-medium text-warning">Queda de mais de 30%</div>
                <div className="text-muted-foreground">
                  Média das últimas 3 leituras: {formatBRL(mediaAnterior!)}. Confira o valor antes de salvar.
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

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="flex-1">Cancelar</Button>
          <Button
            type="submit"
            disabled={saving || !maquinaId}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar leitura
          </Button>
        </div>
      </form>
    </div>
  );
}