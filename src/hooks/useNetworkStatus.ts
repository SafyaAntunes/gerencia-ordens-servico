
import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnecting: false
  });

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão restabelecida');
      setNetworkStatus(prev => ({ ...prev, isOnline: true, isConnecting: false }));
    };

    const handleOffline = () => {
      console.log('🔌 Conexão perdida - modo offline ativado');
      setNetworkStatus(prev => ({ ...prev, isOnline: false, isConnecting: false }));
    };

    const handleConnectionChange = () => {
      if (!navigator.onLine) {
        handleOffline();
      } else {
        setNetworkStatus(prev => ({ ...prev, isConnecting: true }));
        // Dar um tempo para verificar se a conexão está realmente estável
        setTimeout(() => {
          if (navigator.onLine) {
            handleOnline();
          }
        }, 1000);
      }
    };

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    // Verificação periódica da conectividade
    const checkConnection = setInterval(() => {
      if (navigator.onLine !== networkStatus.isOnline) {
        handleConnectionChange();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
      clearInterval(checkConnection);
    };
  }, [networkStatus.isOnline]);

  return networkStatus;
};
