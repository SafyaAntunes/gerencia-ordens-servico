
import { OrdemServico } from '@/types/ordens';
import { indexedDBService, QueueItem } from './indexedDBService';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface SyncStats {
  total: number;
  processed: number;
  errors: number;
  success: number;
}

class SyncService {
  private isSyncing = false;
  private syncListeners: Array<(stats: SyncStats) => void> = [];

  addSyncListener(callback: (stats: SyncStats) => void) {
    this.syncListeners.push(callback);
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(stats: SyncStats) {
    this.syncListeners.forEach(callback => callback(stats));
  }

  async syncPendingOperations(): Promise<void> {
    if (this.isSyncing) {
      console.log('⏳ Sincronização já em andamento...');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Iniciando sincronização...');

    try {
      const queue = await indexedDBService.getSyncQueue();
      
      if (queue.length === 0) {
        console.log('✅ Nenhuma operação pendente para sincronizar');
        return;
      }

      // Ordena por timestamp para processar na ordem correta
      const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);
      
      const stats: SyncStats = {
        total: sortedQueue.length,
        processed: 0,
        errors: 0,
        success: 0
      };

      console.log(`📊 Iniciando sincronização de ${stats.total} operações pendentes`);
      this.notifyListeners(stats);

      for (const item of sortedQueue) {
        try {
          await this.processQueueItem(item);
          stats.success++;
          console.log(`✅ Operação ${item.operation} para ordem ${item.id} sincronizada`);
          
          // Remove da fila após sucesso
          await indexedDBService.removeFromSyncQueue(item.id);
          
          // Remove do storage local se foi uma operação DELETE
          if (item.operation === 'DELETE') {
            await indexedDBService.deleteOrdem(item.id);
          }
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar operação ${item.operation} para ordem ${item.id}:`, error);
          stats.errors++;
          
          // Incrementa tentativas e recoloca na fila se não excedeu o limite
          if (item.retries < 3) {
            await indexedDBService.addToSyncQueue({
              ...item,
              retries: item.retries + 1
            });
          } else {
            console.error(`🚫 Operação ${item.id} excedeu limite de tentativas, removendo da fila`);
            await indexedDBService.removeFromSyncQueue(item.id);
          }
        }
        
        stats.processed++;
        this.notifyListeners(stats);
        
        // Pequena pausa entre operações para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🎉 Sincronização concluída: ${stats.success} sucessos, ${stats.errors} erros`);
      
      if (stats.success > 0) {
        toast.success(`${stats.success} ${stats.success === 1 ? 'ordem sincronizada' : 'ordens sincronizadas'} com sucesso!`);
      }
      
      if (stats.errors > 0) {
        toast.error(`${stats.errors} ${stats.errors === 1 ? 'erro' : 'erros'} durante a sincronização`);
      }

    } catch (error) {
      console.error('💥 Erro geral durante sincronização:', error);
      toast.error('Erro durante a sincronização dos dados');
    } finally {
      this.isSyncing = false;
    }
  }

  private async processQueueItem(item: QueueItem): Promise<void> {
    switch (item.operation) {
      case 'CREATE':
      case 'UPDATE':
        await this.syncCreateOrUpdate(item);
        break;
      case 'DELETE':
        await this.syncDelete(item);
        break;
      default:
        throw new Error(`Operação desconhecida: ${item.operation}`);
    }
  }

  private async syncCreateOrUpdate(item: QueueItem): Promise<void> {
    if (!item.data) {
      throw new Error('Dados não encontrados para operação CREATE/UPDATE');
    }

    // Verifica se existe conflito (dados mais recentes no Firebase)
    const firebaseDoc = await getDoc(doc(db, 'ordens_servico', item.data.id));
    
    if (firebaseDoc.exists() && item.operation === 'CREATE') {
      console.log(`⚠️ Ordem ${item.data.id} já existe no Firebase, convertendo para UPDATE`);
      item.operation = 'UPDATE';
    }

    // Prepara dados para o Firebase
    const dataForFirebase = { ...item.data };
    delete (dataForFirebase as any)._lastModified;
    delete (dataForFirebase as any)._isOffline;

    // Converte Dates para Timestamps
    if (dataForFirebase.dataAbertura instanceof Date) {
      (dataForFirebase as any).dataAbertura = Timestamp.fromDate(dataForFirebase.dataAbertura);
    }
    if (dataForFirebase.dataPrevistaEntrega instanceof Date) {
      (dataForFirebase as any).dataPrevistaEntrega = Timestamp.fromDate(dataForFirebase.dataPrevistaEntrega);
    }

    const ordemRef = doc(db, 'ordens_servico', item.data.id);
    
    if (item.operation === 'CREATE') {
      await setDoc(ordemRef, dataForFirebase);
    } else {
      await updateDoc(ordemRef, dataForFirebase);
    }
  }

  private async syncDelete(item: QueueItem): Promise<void> {
    const ordemRef = doc(db, 'ordens_servico', item.id);
    await deleteDoc(ordemRef);
  }

  async getPendingOperationsCount(): Promise<number> {
    try {
      const queue = await indexedDBService.getSyncQueue();
      return queue.length;
    } catch (error) {
      console.error('Erro ao contar operações pendentes:', error);
      return 0;
    }
  }

  get isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();
