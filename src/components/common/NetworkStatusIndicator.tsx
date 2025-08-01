
import React from 'react';
import { Wifi, WifiOff, RotateCw, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

export const NetworkStatusIndicator = () => {
  const { networkStatus, syncState, forcSync } = useOfflineSync();

  const getStatusIcon = () => {
    if (!networkStatus.isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    if (networkStatus.isConnecting) {
      return <RotateCw className="h-4 w-4 animate-spin" />;
    }

    if (syncState.isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }

    return syncState.pendingCount > 0 ? 
      <CloudOff className="h-4 w-4" /> : 
      <Cloud className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!networkStatus.isOnline) {
      return 'Offline';
    }
    
    if (networkStatus.isConnecting) {
      return 'Conectando...';
    }

    if (syncState.isSyncing) {
      return 'Sincronizando...';
    }

    if (syncState.pendingCount > 0) {
      return `${syncState.pendingCount} pendente${syncState.pendingCount > 1 ? 's' : ''}`;
    }

    return 'Online';
  };

  const getStatusVariant = () => {
    if (!networkStatus.isOnline) return 'destructive';
    if (syncState.pendingCount > 0) return 'secondary';
    return 'default';
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={getStatusVariant()}
        className={cn(
          "flex items-center gap-1 text-xs",
          !networkStatus.isOnline && "bg-red-100 text-red-800 border-red-200",
          syncState.pendingCount > 0 && "bg-yellow-100 text-yellow-800 border-yellow-200"
        )}
      >
        {getStatusIcon()}
        {getStatusText()}
      </Badge>

      {/* Botão de sincronização manual quando há dados pendentes */}
      {networkStatus.isOnline && syncState.pendingCount > 0 && !syncState.isSyncing && (
        <Button
          size="sm"
          variant="outline"
          onClick={forcSync}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sincronizar
        </Button>
      )}

      {/* Indicador de progresso durante sincronização */}
      {syncState.isSyncing && syncState.syncStats && (
        <div className="text-xs text-muted-foreground">
          {syncState.syncStats.processed}/{syncState.syncStats.total}
        </div>
      )}
    </div>
  );
};
