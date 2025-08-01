
import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { syncService } from '@/services/syncService';

interface OfflineSyncState {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt?: Date;
  syncStats?: {
    total: number;
    processed: number;
    errors: number;
    success: number;
  };
}

export const useOfflineSync = () => {
  const networkStatus = useNetworkStatus();
  const [syncState, setSyncState] = useState<OfflineSyncState>({
    pendingCount: 0,
    isSyncing: false
  });

  // Atualiza contador de operações pendentes
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await syncService.getPendingOperationsCount();
      setSyncState(prev => ({ ...prev, pendingCount: count }));
    } catch (error) {
      console.error('Erro ao atualizar contador de pendências:', error);
    }
  }, []);

  // Listener para estatísticas de sincronização
  useEffect(() => {
    const unsubscribe = syncService.addSyncListener((stats) => {
      setSyncState(prev => ({
        ...prev,
        syncStats: stats,
        isSyncing: stats.processed < stats.total
      }));
    });

    return unsubscribe;
  }, []);

  // Sincronização automática quando volta online
  useEffect(() => {
    if (networkStatus.isOnline && !networkStatus.isConnecting) {
      console.log('🔄 Conexão detectada, iniciando sincronização automática...');
      
      const performSync = async () => {
        try {
          await syncService.syncPendingOperations();
          setSyncState(prev => ({
            ...prev,
            lastSyncAt: new Date(),
            isSyncing: false
          }));
          await updatePendingCount();
        } catch (error) {
          console.error('Erro durante sincronização automática:', error);
          setSyncState(prev => ({ ...prev, isSyncing: false }));
        }
      };

      // Aguarda um pouco para estabilizar a conexão
      const timeoutId = setTimeout(performSync, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [networkStatus.isOnline, networkStatus.isConnecting, updatePendingCount]);

  // Atualiza contador periodicamente
  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000); // A cada 10 segundos
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // Função para forçar sincronização manual
  const forcSync = useCallback(async () => {
    if (!networkStatus.isOnline) {
      console.warn('⚠️ Tentativa de sincronização sem conexão');
      return false;
    }

    try {
      setSyncState(prev => ({ ...prev, isSyncing: true }));
      await syncService.syncPendingOperations();
      setSyncState(prev => ({
        ...prev,
        lastSyncAt: new Date(),
        isSyncing: false
      }));
      await updatePendingCount();
      return true;
    } catch (error) {
      console.error('Erro durante sincronização forçada:', error);
      setSyncState(prev => ({ ...prev, isSyncing: false }));
      return false;
    }
  }, [networkStatus.isOnline, updatePendingCount]);

  return {
    networkStatus,
    syncState,
    forcSync,
    updatePendingCount
  };
};
