
import { useState, useCallback } from 'react';
import { SubAtividade, TipoServico } from '@/types/ordens';

export const useTrackingSubatividades = () => {
  const [trackingData, setTrackingData] = useState<Record<string, any>>({});

  // Modified to accept a string for the second parameter instead of SubAtividade[]
  const logSubatividadesState = useCallback((location: string, servicoTipo: string) => {
    console.log(`[${location}] Subatividades tracking for ${servicoTipo}`);
    setTrackingData(prev => ({
      ...prev,
      [`${location}-${servicoTipo}`]: new Date().toISOString()
    }));
  }, []);

  return { trackingData, logSubatividadesState };
};
