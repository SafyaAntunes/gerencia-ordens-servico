
import { OrdemServico } from '@/types/ordens';

const DB_NAME = 'OrdemServicoOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'ordens';
const QUEUE_STORE_NAME = 'sync_queue';

export interface QueueItem {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data?: OrdemServico;
  timestamp: number;
  retries: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('📁 IndexedDB inicializado com sucesso');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para ordens offline
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('dataAbertura', 'dataAbertura');
          store.createIndex('status', 'status');
        }

        // Store para fila de sincronização
        if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
          const queueStore = db.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp');
          queueStore.createIndex('operation', 'operation');
        }
      };
    });
  }

  async saveOrdem(ordem: OrdemServico): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        ...ordem,
        _lastModified: Date.now(),
        _isOffline: true
      });

      request.onsuccess = () => {
        console.log(`💾 Ordem ${ordem.id} salva offline`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('Erro ao salvar ordem offline:', request.error);
        reject(request.error);
      };
    });
  }

  async getOrdem(id: string): Promise<OrdemServico | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Erro ao buscar ordem offline:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllOrdens(): Promise<OrdemServico[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Erro ao buscar ordens offline:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteOrdem(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`🗑️ Ordem ${id} removida do storage offline`);
        resolve();
      };

      request.onerror = () => {
        console.error('Erro ao deletar ordem offline:', request.error);
        reject(request.error);
      };
    });
  }

  async addToSyncQueue(item: QueueItem): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => {
        console.log(`🔄 Operação ${item.operation} para ordem ${item.id} adicionada à fila`);
        resolve();
      };

      request.onerror = () => {
        console.error('Erro ao adicionar à fila de sync:', request.error);
        reject(request.error);
      };
    });
  }

  async getSyncQueue(): Promise<QueueItem[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Erro ao buscar fila de sync:', request.error);
        reject(request.error);
      };
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Erro ao remover da fila de sync:', request.error);
        reject(request.error);
      };
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME, QUEUE_STORE_NAME], 'readwrite');
      
      const ordensStore = transaction.objectStore(STORE_NAME);
      const queueStore = transaction.objectStore(QUEUE_STORE_NAME);
      
      Promise.all([
        new Promise(res => { ordensStore.clear().onsuccess = () => res(true); }),
        new Promise(res => { queueStore.clear().onsuccess = () => res(true); })
      ]).then(() => {
        console.log('🧹 Storage offline limpo');
        resolve();
      }).catch(reject);
    });
  }
}

export const indexedDBService = new IndexedDBService();
