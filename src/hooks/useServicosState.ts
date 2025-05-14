
import { useState, useEffect, useCallback } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { isEqual } from "lodash";
import { FormValues } from "@/components/ordens/form/types";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import { useServicosDebug } from "./ordens/useServicosDebug";
import { useServicosSourceTracking } from "./ordens/useServicosSourceTracking";
import { useSubatividadesLoader } from "./ordens/useSubatividadesLoader";

export const useServicosState = (
  servicosTipos: string[], 
  defaultValues?: Partial<FormValues>
) => {
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [servicosSubatividades, setServicosSubatividades] = useState<Record<string, SubAtividade[]>>({});
  
  // Keep track of previously loaded service types to prevent unnecessary rerenders
  const [previousServiceTypes, setPreviousServiceTypes] = useState<string[]>([]);

  // Get default subatividades from the hook to use as fallback only
  const { defaultSubatividades } = useServicoSubatividades();

  // Use the refactored hooks with component name
  const { debugInfoLoaded } = useServicosDebug();
  const { loadingSources, trackSource, getSourceTrackerObject, logSourceSummary } = useServicosSourceTracking();
  const { hasInitialized, loadSubatividades } = useSubatividadesLoader({
    defaultValues: defaultValues?.servicosSubatividades || {}
  });

  // Initialize from defaultValues once
  useEffect(() => {
    if (hasInitialized) return;
    
    // Important: preserve the 'selected' state of existing subatividades
    if (defaultValues?.servicosSubatividades) {
      const processedSubatividades: Record<string, SubAtividade[]> = {};
      
      Object.entries(defaultValues.servicosSubatividades).forEach(([tipo, subatividades]) => {
        if (subatividades && Array.isArray(subatividades) && subatividades.length > 0) {
          // Ensure all subatividades have the correct states
          processedSubatividades[tipo] = subatividades.map(sub => ({
            ...sub,
            // CORRIGIDO: Preservar o estado 'selecionada', não definir true por padrão
            selecionada: sub.selecionada !== undefined ? sub.selecionada : false,
            // Preserve the 'completed' state or set as false if it doesn't exist
            concluida: sub.concluida ?? false
          }));
        }
      });
      
      console.log("📝 [useServicosState] Subatividades processadas:", processedSubatividades);
      setServicosSubatividades(processedSubatividades);
      
      // Update loading sources
      Object.keys(processedSubatividades).forEach(tipo => {
        trackSource(tipo as TipoServico, "edição");
      });
    }
    
    if (defaultValues?.servicosDescricoes) {
      console.log("📝 [useServicosState] Inicializando descrições de serviços:", defaultValues.servicosDescricoes);
      setServicosDescricoes(prev => {
        if (isEqual(prev, defaultValues.servicosDescricoes)) return prev;
        return defaultValues.servicosDescricoes ?? {};
      });
    }
  }, [defaultValues?.servicosSubatividades, defaultValues?.servicosDescricoes, hasInitialized, trackSource]);

  // Load subatividades for each service type - with optimizations
  useEffect(() => {
    // Skip if service types haven't changed
    if (isEqual(servicosTipos.sort(), previousServiceTypes.sort()) && hasInitialized) {
      console.log("⏭️ [useServicosState] Tipos de serviço não mudaram, pulando carregamento");
      return;
    }
    
    console.log("🔄 [useServicosState] Tipos de serviço mudaram:", servicosTipos);
    console.log("🔄 [useServicosState] Tipos anteriores:", previousServiceTypes);
    
    setPreviousServiceTypes([...servicosTipos]);
    
    // Track pending async operations
    let isMounted = true;
    const sourceTracker = getSourceTrackerObject();
    
    const loadSubatividadesForType = async (tipo: TipoServico) => {
      const result = await loadSubatividades(tipo);
      
      if (result && isMounted) {
        console.log(`✅ [useServicosState] Atualizando subatividades para ${tipo} após carregamento:`, result);
        setServicosSubatividades(prev => ({
          ...prev,
          [tipo]: result
        }));
      }
    };

    // Always load subatividades for all selected service types
    servicosTipos.forEach((tipo) => {
      loadSubatividadesForType(tipo as TipoServico);
    });

    // Remove subatividades for types that are no longer selected
    setServicosSubatividades(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach((tipo) => {
        if (!servicosTipos.includes(tipo)) {
          delete newState[tipo];
        }
      });
      return newState;
    });
    
    // Log sources after all loads are complete
    logSourceSummary();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [
    servicosTipos, 
    previousServiceTypes, 
    hasInitialized,
    loadSubatividades,
    getSourceTrackerObject,
    logSourceSummary
  ]);

  const handleServicoDescricaoChange = useCallback((tipo: string, descricao: string) => {
    setServicosDescricoes(prev => {
      if (prev[tipo] === descricao) return prev;
      return {
        ...prev,
        [tipo]: descricao
      };
    });
  }, []);
  
  const handleSubatividadesChange = useCallback((tipo: TipoServico, subatividades: SubAtividade[]) => {
    console.log(`[handleSubatividadesChange] Atualizando subatividades para ${tipo}:`, subatividades);
    setServicosSubatividades(prev => {
      // Skip update if no actual changes to prevent re-renders
      if (isEqual(prev[tipo], subatividades)) return prev;
      
      return {
        ...prev,
        [tipo]: subatividades
      };
    });
  }, []);

  return {
    servicosDescricoes,
    servicosSubatividades,
    loadingSources,
    handleServicoDescricaoChange,
    handleSubatividadesChange
  };
};
