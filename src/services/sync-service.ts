import { db, type PendingLeitura, type PendingFoto } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from '@/lib/audit';

export async function saveOfflineLeitura(
  data: Omit<PendingLeitura, 'id' | 'status' | 'created_at' | 'tempId'>,
  fotos: { campo: string; blob: Blob; fileName: string }[]
) {
  const tempId = crypto.randomUUID();
  
  await db.pendingLeituras.add({
    ...data,
    tempId,
    status: 'pending',
    created_at: Date.now()
  });

  for (const foto of fotos) {
    await db.pendingFotos.add({
      tempLeituraId: tempId,
      campo: foto.campo,
      blob: foto.blob,
      fileName: foto.fileName
    });
  }
}

export async function syncPendingLeituras() {
  const pending = await db.pendingLeituras
    .where('status')
    .anyOf(['pending', 'error'])
    .toArray();

  if (pending.length === 0) return;

  for (const leitura of pending) {
    try {
      await db.pendingLeituras.update(leitura.id!, { status: 'syncing' });

      const { data: inserted, error: insErr } = await supabase
        .from('leituras')
        .insert({
          maquina_id: leitura.maquina_id,
          cliente_id: leitura.cliente_id,
          usuario_id: leitura.usuario_id,
          valor_faturado: leitura.valor_faturado,
          pelucias_saidas: leitura.pelucias_saidas,
          valor_comissao: leitura.valor_comissao,
          valor_liquido: leitura.valor_liquido,
          percentual_aplicado: leitura.percentual_comissao,
          observacoes: leitura.observacoes,
          data_leitura: leitura.data_leitura,
          status: 'pendente',
          contador_entrada_atual: leitura.contador_entrada_atual,
          contador_saida_atual: leitura.contador_saida_atual,
          contador_entrada_anterior: leitura.contador_entrada_anterior,
          contador_saida_anterior: leitura.contador_saida_anterior,
          valor_por_credito: leitura.valor_por_credito,
        })
        .select('id')
        .single();

      if (insErr) throw insErr;

      const fotos = await db.pendingFotos
        .where('tempLeituraId')
        .equals(leitura.tempId)
        .toArray();

      for (let i = 0; i < fotos.length; i++) {
        const foto = fotos[i];
        const path = `${inserted.id}/${i + 1}-${Date.now()}.jpg`;
        
        const { error: upErr } = await supabase.storage
          .from('leitura-fotos')
          .upload(path, foto.blob, { contentType: 'image/jpeg' });
          
        if (upErr) {
          console.error('Error uploading photo during sync:', upErr);
          continue;
        }

        const { data: pub } = supabase.storage
          .from('leitura-fotos')
          .getPublicUrl(path);

        await supabase.from('leitura_fotos').insert({
          leitura_id: inserted.id,
          foto_url: pub.publicUrl,
          ordem: i + 1,
        });
      }

      await logAudit({
        acao: 'CREATE_LEITURA',
        tabela: 'leituras',
        registro_id: inserted.id,
        dados_depois: { 
          valor_faturado: leitura.valor_faturado, 
          percentual: leitura.percentual_comissao,
          offline: true 
        },
      });

      await db.pendingLeituras.update(leitura.id!, { 
        status: 'synced',
        synced_at: Date.now()
      });

    } catch (err: any) {
      console.error('Sync failed for leitura:', leitura.id, err);
      await db.pendingLeituras.update(leitura.id!, { 
        status: 'error', 
        error_message: err.message || 'Erro desconhecido' 
      });
    }
  }
}

export async function cleanupSyncedLeituras() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  const toDelete = await db.pendingLeituras
    .where('status')
    .equals('synced')
    .filter(l => l.synced_at ? l.synced_at < oneDayAgo : false)
    .toArray();

  for (const leitura of toDelete) {
    await db.pendingFotos.where('tempLeituraId').equals(leitura.tempId).delete();
    await db.pendingLeituras.delete(leitura.id!);
  }
}
