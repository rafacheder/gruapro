 import { useState } from "react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Printer, Loader2 } from "lucide-react";
 import { formatBRL, formatDateTime } from "@/lib/format";
 import { useAuth } from "@/contexts/AuthContext";
 import { logAudit } from "@/lib/audit";
 
 interface ThermalPrintDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   data: {
     cliente_nome: string;
     data_leitura: string;
     operador_nome?: string;
     leituras: any[];
     totalEntrada?: number;
     totalSaida?: number;
     totalGeral?: number;
     totalComissao?: number;
     totalLiquido?: number;
     isSingle?: boolean;
   };
 }
 
 export function ThermalPrintDialog({ open, onOpenChange, data }: ThermalPrintDialogProps) {
   const { user, nome } = useAuth();
   const [printing, setPrinting] = useState(false);
   const operador = data.operador_nome || nome || user?.email || "Operador";
 
   const handlePrint = async () => {
     setPrinting(true);
     try {
       await logAudit({
         acao: "PRINT_THERMAL",
         tabela: "leituras",
         registro_id: data.isSingle ? data.leituras[0]?.id : null,
         dados_depois: { ids: data.leituras.map(l => l.id) },
       });
       window.print();
       onOpenChange(false);
     } finally {
       setPrinting(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-[400px] max-h-[90vh] flex flex-col p-0">
         <DialogHeader className="p-6 pb-2">
           <DialogTitle className="flex items-center gap-2">
             <Printer className="h-5 w-5" />
             Imprimir relatório (bobina 57mm)
           </DialogTitle>
         </DialogHeader>
 
         <div className="flex-1 overflow-auto p-6 pt-2">
           <p className="text-sm text-muted-foreground mb-4">
             Confirme abaixo para enviar para a impressora. Selecione sua impressora Bluetooth na próxima tela.
           </p>
 
           {/* Preview Area */}
           <div className="bg-white text-black p-4 rounded-md shadow-inner border font-mono text-[10px] leading-tight mx-auto w-[48mm] min-h-[100mm]">
             <div className="text-center font-bold text-sm mb-2">GRUAPRO</div>
             <div className="text-center mb-2">--------------</div>
             <div>Cliente: {data.cliente_nome}</div>
             <div>Data: {formatDateTime(data.data_leitura).split(' ')[0]}</div>
             <div>Operador: {operador}</div>
 
             <div className="text-center my-2 font-bold">
               ================<br />
               {data.isSingle ? "LEITURA" : "LEITURAS"}<br />
               ================
             </div>
 
             {data.leituras.map((l, i) => (
               <div key={l.id} className="mb-4">
                 <div className="font-bold">{i + 1} - {l.maquina_codigo || l.maquinas?.codigo_identificacao}</div>
                 <div className="whitespace-pre">  ANT  {String(l.contador_entrada_anterior ?? 0).padStart(5)} {String(l.contador_saida_anterior ?? 0).padStart(5)}</div>
                 <div className="whitespace-pre">  ATU  {String(l.contador_entrada_atual ?? 0).padStart(5)} {String(l.contador_saida_atual ?? 0).padStart(5)}</div>
                 <div className="flex justify-between">
                   <span>  Total</span>
                   <span>{formatBRL(l.valor_faturado)}</span>
                 </div>
                 {!data.isSingle && (
                   <>
                     <div className="flex justify-between">
                       <span>  Comiss.</span>
                       <span>{formatBRL(l.valor_comissao)}</span>
                     </div>
                     <div className="flex justify-between font-bold">
                       <span>  Receber</span>
                       <span>{formatBRL(l.valor_liquido)}</span>
                     </div>
                   </>
                 )}
                 <div className="text-center mt-2 opacity-50">----------------</div>
               </div>
             ))}
 
             {!data.isSingle && (
               <>
                 <div className="text-center my-2 font-bold">
                   ================<br />
                   TOTAIS<br />
                   ================
                 </div>
                 <div className="flex justify-between">
                   <span>Entrada:</span>
                   <span>{data.totalEntrada}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Saida:</span>
                   <span>{data.totalSaida}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Geral:</span>
                   <span>{formatBRL(data.totalGeral)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Comiss.:</span>
                   <span>{formatBRL(data.totalComissao)}</span>
                 </div>
                 <div className="flex justify-between font-bold">
                   <span>Saldo:</span>
                   <span>{formatBRL(data.totalLiquido)}</span>
                 </div>
                 <div className="text-center my-2 opacity-50">----------------</div>
               </>
             )}
 
             {data.isSingle && (
               <>
                 <div className="flex justify-between">
                   <span>Comiss. ({data.leituras[0].percentual_aplicado}%):</span>
                   <span>{formatBRL(data.leituras[0].valor_comissao)}</span>
                 </div>
                 <div className="flex justify-between font-bold text-xs mt-1">
                   <span>LÍQUIDO:</span>
                   <span>{formatBRL(data.leituras[0].valor_liquido)}</span>
                 </div>
               </>
             )}
 
             <div className="mt-4 text-[8px] opacity-70">
               Gerado: {formatDateTime(new Date())}<br />
               Por: {operador}<br />
               Sistema v2.0.0
             </div>
           </div>
         </div>
 
         <DialogFooter className="p-6 pt-2 flex gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
             Cancelar
           </Button>
           <Button onClick={handlePrint} className="flex-1 bg-primary" disabled={printing}>
             {printing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
             Confirmar e imprimir
           </Button>
         </DialogFooter>
       </DialogContent>
 
       {/* Print Area - CSS only visible when printing */}
       <style>
         {`
           @media print {
             @page {
               size: 48mm auto;
               margin: 0;
             }
             body * {
               visibility: hidden;
               height: 0;
               overflow: hidden;
             }
             #thermal-print-area, #thermal-print-area * {
               visibility: visible;
               height: auto;
               overflow: visible;
             }
             #thermal-print-area {
               position: absolute;
               left: 0;
               top: 0;
               width: 48mm;
               padding: 2mm 4.5mm;
               font-family: 'Courier New', Courier, monospace;
               font-size: 8pt;
               line-height: 1.1;
               color: black !important;
               background: white !important;
             }
           }
           #thermal-print-area {
             display: none;
           }
           @media print {
             #thermal-print-area {
               display: block;
             }
           }
         `}
       </style>
 
       <div id="thermal-print-area">
         <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', marginBottom: '2mm' }}>GRUAPRO</div>
         <div style={{ textAlign: 'center', marginBottom: '2mm' }}>--------------</div>
         <div>Cliente: {data.cliente_nome}</div>
         <div>Data: {formatDateTime(data.data_leitura).split(' ')[0]}</div>
         <div>Operador: {operador}</div>
 
         <div style={{ textAlign: 'center', margin: '3mm 0', fontWeight: 'bold' }}>
           ================<br />
           {data.isSingle ? "LEITURA" : "LEITURAS"}<br />
           ================
         </div>
 
         {data.leituras.map((l, i) => (
           <div key={l.id} style={{ marginBottom: '4mm' }}>
             <div style={{ fontWeight: 'bold' }}>{i + 1} - {l.maquina_codigo || l.maquinas?.codigo_identificacao}</div>
             <div style={{ whiteSpace: 'pre' }}>  ANT  {String(l.contador_entrada_anterior ?? 0).padStart(5)} {String(l.contador_saida_anterior ?? 0).padStart(5)}</div>
             <div style={{ whiteSpace: 'pre' }}>  ATU  {String(l.contador_entrada_atual ?? 0).padStart(5)} {String(l.contador_saida_atual ?? 0).padStart(5)}</div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>  Total</span>
               <span>{formatBRL(l.valor_faturado)}</span>
             </div>
             {!data.isSingle && (
               <>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span>  Comiss.</span>
                   <span>{formatBRL(l.valor_comissao)}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span>  Receber</span>
                   <span>{formatBRL(l.valor_liquido)}</span>
                 </div>
               </>
             )}
             <div style={{ textAlign: 'center', marginTop: '2mm' }}>----------------</div>
           </div>
         ))}
 
         {!data.isSingle && (
           <>
             <div style={{ textAlign: 'center', margin: '3mm 0', fontWeight: 'bold' }}>
               ================<br />
               TOTAIS<br />
               ================
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>Entrada:</span>
               <span>{data.totalEntrada}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>Saida:</span>
               <span>{data.totalSaida}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>Geral:</span>
               <span>{formatBRL(data.totalGeral)}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>Comiss.:</span>
               <span>{formatBRL(data.totalComissao)}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
               <span>Saldo:</span>
               <span>{formatBRL(data.totalLiquido)}</span>
             </div>
             <div style={{ textAlign: 'center', margin: '3mm 0' }}>----------------</div>
           </>
         )}
 
         {data.isSingle && (
           <>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span>Comiss. ({data.leituras[0].percentual_aplicado}%):</span>
               <span>{formatBRL(data.leituras[0].valor_comissao)}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
               <span>LÍQUIDO:</span>
               <span>{formatBRL(data.leituras[0].valor_liquido)}</span>
             </div>
           </>
         )}
 
         <div style={{ fontSize: '7pt', marginTop: '4mm' }}>
           Gerado: {formatDateTime(new Date())}<br />
           Por: {operador}<br />
           Sistema v2.0.0
         </div>
       </div>
     </Dialog>
   );
 }