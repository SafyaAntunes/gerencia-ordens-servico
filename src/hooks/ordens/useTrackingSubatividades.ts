
import { useEffect, useState } from 'react';
import { SubAtividade, TipoServico } from '@/types/ordens';

/**
 * Hook to track subatividades state through the various components
 */
export const useTrackingSubatividades = () => {
  const [trackingData, setTrackingData] = useState<Record<string, {
    source: string,
    count: number,
    selected: number
  }>>({});

  /**
   * Track a subatividade update event
   */
  const trackSubatividadesUpdate = (
    tipoServico: TipoServico, 
    source: string, 
    subatividades: SubAtividade[]
  ) => {
    const selected = subatividades.filter(s => s.selecionada).length;
    
    console.log(`[useTrackingSubatividades] ${source} - ${tipoServico}: ${selected}/${subatividades.length} selecionadas`);
    
    setTrackingData(prev => ({
      ...prev,
      [tipoServico]: {
        source,
        count: subatividades.length,
        selected
      }
    }));
  };

  /**
   * Log the current tracking state
   */
  const logTrackingState = () => {
    console.table(
      Object.entries(trackingData).map(([tipo, data]) => ({
        Tipo: tipo,
        Origem: data.source,
        Total: data.count,
        Selecionadas: data.selected,
        Percentual: `${Math.round((data.selected / data.count) * 100)}%`
      }))
    );
  };

  return {
    trackSubatividadesUpdate,
    logTrackingState,
    trackingData
  };
};
