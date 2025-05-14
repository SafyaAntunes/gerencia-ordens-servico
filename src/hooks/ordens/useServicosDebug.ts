
import { useEffect } from 'react';
import { SubAtividade } from '@/types/ordens';
import { useTrackingSubatividades } from './useTrackingSubatividades';

/**
 * Hook para debug de serviços e subatividades
 */
export function useServicosDebug(componentName: string) {
  const { logSubatividadesState } = useTrackingSubatividades();
  
  const logSubatividades = (
    context: string, 
    tipoServico: string, 
    subatividades?: SubAtividade[]
  ) => {
    logSubatividadesState(`${componentName}-${context}`, tipoServico, subatividades);
  };
  
  return {
    logSubatividades
  };
}
