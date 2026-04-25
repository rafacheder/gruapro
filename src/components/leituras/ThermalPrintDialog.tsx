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

   const ThermalContent = ({ isPreview = false }: { isPreview?: boolean }) => (
     <div className={isPreview ? "" : "print-area"}>
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
   );
 
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
 
          <div className="flex-1 overflow-auto p-6 pt-2 no-print">
            <p className="text-sm text-muted-foreground mb-4">
              Confirme abaixo para enviar para a impressora. Selecione sua impressora Bluetooth na próxima tela.
            </p>

            {/* Preview Area */}
            <div className="bg-white text-black p-4 rounded-md shadow-inner border font-mono text-[10px] leading-tight mx-auto w-[48mm] min-h-[100mm]">
              <ThermalContent isPreview />
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
 
        <style>
          {`
            @media print {
              @page {
                size: 48mm auto;
                margin: 2mm;
              }
              body * {
                visibility: hidden !important;
              }
              .print-area, .print-area * {
                visibility: visible !important;
              }
              .print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 44mm !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: 'Courier New', Courier, monospace !important;
                font-size: 8pt !important;
                line-height: 1.1 !important;
                color: black !important;
                background: white !important;
                display: block !important;
              }
              .no-print {
                display: none !important;
              }
              [role="dialog"], [data-radix-portal] {
                position: static !important;
                transform: none !important;
                visibility: visible !important;
              }
            }
            .print-area {
              display: none;
            }
          `}
        </style>

        <ThermalContent />
     </Dialog>
   );
 }