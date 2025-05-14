
import { useState } from "react";
import { TipoServico, SubAtividade } from "@/types/ordens";

export const useServicosSourceTracking = () => {
  const [loadingSources, setLoadingSources] = useState<Record<string, string>>({});
  const [subatividadesOrigins, setSubatividadesOrigins] = useState<Record<string, string>>({});

  const trackSubatividadesOrigin = (
    servicoTipo: TipoServico,
    subatividades: SubAtividade[],
    source: string
  ) => {
    setSubatividadesOrigins(prev => ({
      ...prev,
      [servicoTipo]: source
    }));
  };

  // These methods are required by the existing code
  const trackSource = (tipo: TipoServico, source: string) => {
    setLoadingSources(prev => ({
      ...prev,
      [tipo]: source
    }));
  };

  const getSourceTrackerObject = () => {
    return { ...subatividadesOrigins };
  };

  const logSourceSummary = () => {
    console.log("[useServicosSourceTracking] Source summary:", subatividadesOrigins);
  };

  return {
    loadingSources,
    subatividadesOrigins,
    trackSubatividadesOrigin,
    trackSource,
    getSourceTrackerObject,
    logSourceSummary
  };
};
