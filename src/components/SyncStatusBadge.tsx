 import { useLiveQuery } from "dexie-react-hooks";
 import { db } from "@/lib/db";
 import { useOnlineStatus } from "@/hooks/use-online-status";
import { Cloud, CloudOff, RefreshCw, AlertCircle, Trash2, Send, AlertTriggerOctagon, ShieldAlert } from "lucide-react";
 import { Button } from "./ui/button";
 import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
 } from "./ui/sheet";
 import { Badge } from "./ui/badge";
import {
  syncPendingLeituras,
  forceSyncLeitura,
  discardConflictLeitura,
} from "@/services/sync-service";
 import { useState } from "react";
 import { toast } from "sonner";
 import { formatBRL, formatDateTime } from "@/lib/format";
 
 export default function SyncStatusBadge() {
   const isOnline = useOnlineStatus();
   const [isSyncing, setIsSyncing] = useState(false);
 
   const pendingLeituras = useLiveQuery(() => db.pendingLeituras.toArray());
   const count = pendingLeituras?.length || 0;
   const syncingCount = pendingLeituras?.filter(l => l.status === 'syncing').length || 0;
   const errorCount = pendingLeituras?.filter(l => l.status === 'error').length || 0;
  const conflictCount = pendingLeituras?.filter(l => l.status === 'conflict').length || 0;
  const conflicts = pendingLeituras?.filter(l => l.status === 'conflict') || [];
 
   const handleSync = async () => {
     if (!isOnline) {
       toast.error("Sem conexão para sincronizar");
       return;
     }
     setIsSyncing(true);
     try {
       await syncPendingLeituras();
     } finally {
       setIsSyncing(false);
     }
   };
 
   const discardLeitura = async (id: number) => {
     if (confirm("Tem certeza que deseja descartar esta leitura offline?")) {
       const leitura = await db.pendingLeituras.get(id);
       if (leitura) {
         await db.pendingFotos.where('tempLeituraId').equals(leitura.tempId).delete();
         await db.pendingLeituras.delete(id);
         toast.success("Leitura descartada");
       }
     }
   };
 
   if (!isOnline && count === 0) {
     return (
       <Badge variant="outline" className="text-muted-foreground gap-1">
         <CloudOff className="h-3 w-3" /> Offline
       </Badge>
     );
   }
 
   if (isSyncing || syncingCount > 0) {
     return (
       <Badge variant="outline" className="text-blue-500 gap-1 animate-pulse">
         <RefreshCw className="h-3 w-3 animate-spin" /> {syncingCount > 0 ? `Enviando ${syncingCount}...` : 'Sincronizando...'}
       </Badge>
     );
   }
 
  if (conflictCount > 0) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Badge variant="destructive" className="gap-1 cursor-pointer" title={`${conflictCount} leitura(s) em conflito`}>
            <ShieldAlert className="h-3 w-3" /> {conflictCount} em conflito
          </Badge>
        </SheetTrigger>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Conflitos de sincronização</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Outra leitura foi registrada online enquanto você estava offline. Revise antes de enviar.
            </p>
            {conflicts.map(leitura => (
              <div key={leitura.id} className="p-3 border border-destructive/40 rounded-lg space-y-3 bg-destructive/5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">Sua leitura (offline)</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(leitura.created_at)}</div>
                  </div>
                  <Badge variant="destructive">conflito</Badge>
                </div>
                <div className="text-xs space-y-1">
                  <div>Entrada: <strong>{leitura.contador_entrada_atual}</strong></div>
                  <div>Saída: <strong>{leitura.contador_saida_atual}</strong></div>
                  <div>Valor: <strong>{formatBRL(leitura.valor_faturado)}</strong></div>
                </div>
                {leitura.conflict_data && (
                  <div className="text-xs space-y-1 border-t border-destructive/30 pt-2">
                    <div className="font-medium">Leitura mais recente do servidor:</div>
                    <div>Entrada: <strong>{leitura.conflict_data.server_contador_entrada_atual ?? '—'}</strong></div>
                    <div>Saída: <strong>{leitura.conflict_data.server_contador_saida_atual ?? '—'}</strong></div>
                    <div>Data: <strong>{leitura.conflict_data.server_data_leitura ? formatDateTime(leitura.conflict_data.server_data_leitura) : '—'}</strong></div>
                  </div>
                )}
                {leitura.error_message && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    {leitura.error_message}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={async () => {
                      if (confirm("Descartar sua leitura e manter a do servidor?")) {
                        await discardConflictLeitura(leitura.id!);
                        toast.success("Leitura descartada");
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Descartar minha leitura
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!isOnline}
                    onClick={async () => {
                      if (confirm("Enviar mesmo com conflito? A leitura do servidor permanecerá registrada.")) {
                        await forceSyncLeitura(leitura.id!);
                        toast.success("Leitura enviada (forçado)");
                      }
                    }}
                  >
                    <Send className="h-3 w-3 mr-1" /> Forçar envio mesmo assim
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.info("Compartilhe os detalhes deste conflito com um administrador.")}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" /> Falar com admin
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

   if (errorCount > 0) {
     return (
       <Sheet>
         <SheetTrigger asChild>
           <Badge variant="destructive" className="gap-1 cursor-pointer">
             <AlertCircle className="h-3 w-3" /> {errorCount} erro(s)
           </Badge>
         </SheetTrigger>
         <SheetContent>
           <SheetHeader>
             <SheetTitle>Fila de sincronização</SheetTitle>
           </SheetHeader>
           <div className="mt-4 space-y-4">
             {pendingLeituras?.map(leitura => (
               <div key={leitura.id} className="p-3 border rounded-lg space-y-2">
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="text-sm font-medium">Leitura offline</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(leitura.created_at)}</div>
                   </div>
                   <Badge variant={leitura.status === 'error' ? 'destructive' : 'outline'}>
                     {leitura.status}
                   </Badge>
                 </div>
                 <div className="text-sm">Valor: {formatBRL(leitura.valor_faturado)}</div>
                 {leitura.error_message && (
                   <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                     {leitura.error_message}
                   </div>
                 )}
                 <div className="flex gap-2">
                   <Button size="sm" variant="outline" onClick={() => handleSync()} disabled={!isOnline}>
                     <RefreshCw className="h-3 w-3 mr-1" /> Tentar
                   </Button>
                   <Button size="sm" variant="ghost" className="text-destructive" onClick={() => discardLeitura(leitura.id!)}>
                     <Trash2 className="h-3 w-3 mr-1" /> Descartar
                   </Button>
                 </div>
               </div>
             ))}
           </div>
         </SheetContent>
       </Sheet>
     );
   }
 
   if (count > 0) {
     return (
       <Sheet>
         <SheetTrigger asChild>
           <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 gap-1 cursor-pointer">
             <Cloud className="h-3 w-3" /> {count} pendente(s)
           </Badge>
         </SheetTrigger>
         <SheetContent>
           <SheetHeader>
             <SheetTitle>Fila de sincronização</SheetTitle>
           </SheetHeader>
           <div className="mt-4 space-y-4">
             <Button className="w-full" onClick={handleSync} disabled={!isOnline}>
               <Send className="h-4 w-4 mr-2" /> Sincronizar tudo agora
             </Button>
             {pendingLeituras?.map(leitura => (
               <div key={leitura.id} className="p-3 border rounded-lg space-y-2">
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="text-sm font-medium">Leitura offline</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(leitura.created_at)}</div>
                   </div>
                   <Badge variant="outline">Pendente</Badge>
                 </div>
                 <div className="text-sm">Valor: {formatBRL(leitura.valor_faturado)}</div>
                 <Button size="sm" variant="ghost" className="text-destructive w-full" onClick={() => discardLeitura(leitura.id!)}>
                   <Trash2 className="h-3 w-3 mr-1" /> Descartar
                 </Button>
               </div>
             ))}
           </div>
         </SheetContent>
       </Sheet>
     );
   }
 
   return (
     <Badge variant="outline" className="text-green-500 border-green-500/50 gap-1">
       <div className="h-2 w-2 rounded-full bg-green-500" /> Online
     </Badge>
   );
 }