
import { useState, useCallback } from 'react';

/**
 * Hook para rastreamento da origem de dados de serviços
 */
export function useServicosSourceTracking(componentName: string = 'unknown') {
  const [loadingSources, setLoadingSources] = useState<Record<string, string>>({});
  const [sourceTracker, setSourceTracker] = useState<Record<string, any>>({});

  const trackSource = useCallback((key: string, source: string, data?: any) => {
    setLoadingSources(prev => ({ ...prev, [key]: source }));
    setSourceTracker(prev => ({
      ...prev,
      [key]: {
        source,
        timestamp: new Date().toISOString(),
        data: data ? JSON.parse(JSON.stringify(data)) : null
      }
    }));
  }, []);

  const getSourceTrackerObject = useCallback(() => {
    return sourceTracker;
  }, [sourceTracker]);

  const logSourceSummary = useCallback(() => {
    console.log(`[${componentName}] Fontes de dados carregadas:`, loadingSources);
    console.log(`[${componentName}] Rastreamento completo:`, sourceTracker);
  }, [componentName, loadingSources, sourceTracker]);

  return {
    loadingSources,
    trackSource,
    getSourceTrackerObject,
    logSourceSummary
  };
}
