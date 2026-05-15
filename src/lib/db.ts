 import Dexie, { type Table } from 'dexie';
 
 export interface PendingLeitura {
   id?: number;
   tempId: string; // Used to link with photos
   maquina_id: string;
   cliente_id: string;
    contador_entrada_atual: number;
    contador_saida_atual: number;
    contador_entrada_anterior: number;
    contador_saida_anterior: number;
    valor_por_credito: number;
   valor_faturado: number;
   valor_comissao: number;
   valor_liquido: number;
   pelucias_saidas: number;
   observacoes?: string;
   percentual_comissao: number;
   data_leitura: string;
   usuario_id: string;
   status: 'pending' | 'syncing' | 'error' | 'synced' | 'conflict';
   conflict_data?: {
     server_contador_entrada_atual?: number;
     server_contador_saida_atual?: number;
     server_data_leitura?: string;
   };
   synced_at?: number;
   error_message?: string;
   created_at: number;
 }
 
 export interface PendingFoto {
   id?: number;
   tempLeituraId: string;
   campo: string; // e.g., 'foto_contador', 'foto_premio'
   blob: Blob;
   fileName: string;
 }
 
 export class OfflineDatabase extends Dexie {
   pendingLeituras!: Table<PendingLeitura>;
   pendingFotos!: Table<PendingFoto>;
 
   constructor() {
     super('OfflineLeiturasDB');
     this.version(1).stores({
       pendingLeituras: '++id, tempId, status, usuario_id, created_at',
       pendingFotos: '++id, tempLeituraId'
     });
   }
 }
 
 export const db = new OfflineDatabase();