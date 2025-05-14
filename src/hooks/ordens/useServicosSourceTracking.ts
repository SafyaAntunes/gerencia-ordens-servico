
import { useState, useEffect } from 'react';
import { SubAtividade, TipoServico } from '@/types/ordens';
import { useTrackingSubatividades } from './useTrackingSubatividades';

/**
 * Hook para rastrear a origem das subatividades em diferentes componentes
 * Isso ajudará a identificar onde estão ocorrendo problemas
 */
export function useServicosSourceTracking() {
  const [loadingSources, setLoadingSources] = useState<Record<string, string>>({});
  const [subatividadesOrigins, setSubatividadesOrigins] = useState<Record<string, string>>({});
  const { logSubatividadesState } = useTrackingSubatividades();
  
  // Track the source of subatividades being loaded
  const trackSource = (
    servicoTipo: TipoServico, 
    source: string
  ) => {
    // Registrar fonte de carregamento
    setLoadingSources(prev => ({
      ...prev,
      [servicoTipo]: source
    }));
    
    console.log(`[useServicosSourceTracking] Origem das subatividades para ${servicoTipo}: ${source}`);
  };
  
  // Track subatividades with their origin
  const trackSubatividadesOrigin = (
    servicoTipo: TipoServico, 
    subatividades: SubAtividade[] | undefined,
    source: string
  ) => {
    if (!subatividades) return;
    
    // Registrar origem das subatividades
    setSubatividadesOrigins(prev => ({
      ...prev,
      [servicoTipo]: source
    }));
    
    // Registrar fonte de carregamento
    setLoadingSources(prev => ({
      ...prev,
      [servicoTipo]: source
    }));
    
    // Debug do estado das subatividades nesta origem
    logSubatividadesState(`Origin: ${source}`, servicoTipo, subatividades);
  };
  
  // Get a new object to track sources
  const getSourceTrackerObject = () => {
    return {};
  };
  
  // Log a summary of tracked sources
  const logSourceSummary = (sourceTracker: Record<string, string>) => {
    console.log("[useServicosSourceTracking] Resumo das origens:", sourceTracker);
    console.log("[useServicosSourceTracking] Estado atual:", loadingSources);
  };
  
  return {
    loadingSources,
    subatividadesOrigins,
    trackSubatividadesOrigin,
    trackSource,
    getSourceTrackerObject,
    logSourceSummary
  };
}
