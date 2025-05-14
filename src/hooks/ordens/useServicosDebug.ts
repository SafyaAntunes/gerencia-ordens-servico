
import { useEffect } from 'react';

/**
 * Hook para ajudar no debug de problemas com serviços
 */
export function useServicosDebug(componentName: string = 'unknown') {
  useEffect(() => {
    console.log(`[${componentName}] Componente montado`);
    
    return () => {
      console.log(`[${componentName}] Componente desmontado`);
    };
  }, [componentName]);
  
  const debugInfoLoaded = (info: string) => {
    console.log(`[${componentName}] ${info}`);
  };
  
  return { debugInfoLoaded };
}
