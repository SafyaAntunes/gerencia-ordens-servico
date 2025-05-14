
import { useState } from "react";
import { TipoServico } from "@/types/ordens";

/**
 * Hook for tracking the source of subatividades for each service type
 */
export const useServicosSourceTracking = () => {
  const [loadingSources, setLoadingSources] = useState<Record<string, string>>({});

  const trackSource = (tipo: TipoServico, source: string) => {
    setLoadingSources(prev => ({...prev, [tipo]: source}));
  };

  const getSourceTrackerObject = () => {
    const sourceTracker: Record<string, string> = {};
    return sourceTracker;
  };

  const logSourceSummary = (sourceTracker: Record<string, string>) => {
    setTimeout(() => {
      console.log("📊 [useServicosState] Origem das subatividades carregadas:", sourceTracker);
    }, 1000);
  };

  return { 
    loadingSources, 
    trackSource, 
    getSourceTrackerObject,
    logSourceSummary
  };
};
