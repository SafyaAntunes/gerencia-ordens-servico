
import { useEffect, useState } from 'react';
import { SubAtividade } from '@/types/ordens';
import { useTrackingSubatividades } from './useTrackingSubatividades';

/**
 * Hook para debug de serviços e subatividades
 */
export function useServicosDebug(componentName: string = 'unknown') {
  const { logSubatividadesState } = useTrackingSubatividades();
  const [debugInfoLoaded, setDebugInfoLoaded] = useState(false);
  
  useEffect(() => {
    if (!debugInfoLoaded) {
      console.log(`[${componentName}] useServicosDebug inicializado`);
      setDebugInfoLoaded(true);
    }
  }, [componentName, debugInfoLoaded]);
  
  const logSubatividades = (
    context: string, 
    tipoServico: string, 
    subatividades?: SubAtividade[]
  ) => {
    logSubatividadesState(`${componentName}-${context}`, tipoServico, subatividades);
  };
  
  return {
    debugInfoLoaded,
    logSubatividades
  };
}
