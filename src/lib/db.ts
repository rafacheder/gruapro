 import Dexie, { type Table } from 'dexie';
 
 export interface PendingLeitura {
   id?: number;
   tempId: string; // Used to link with photos
   maquina_id: string;
   cliente_id: string;
   leitura_anterior: number;
   leitura_atual: number;
   valor_total: number;
   valor_empresa: number;
   valor_cliente: number;
   percentual_comissao: number;
   data_leitura: string;
   usuario_id: string;
   status: 'pending' | 'syncing' | 'error';
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