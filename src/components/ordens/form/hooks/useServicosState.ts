import { useState, useEffect, useCallback } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { isEqual } from "lodash";
import { FormValues } from "../types";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";

export const useServicosState = (
  servicosTipos: string[], 
  defaultValues?: Partial<FormValues>
) => {
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [servicosSubatividades, setServicosSubatividades] = useState<Record<string, SubAtividade[]>>({});
  
  // Keep track of previously loaded service types to prevent unnecessary rerenders
  const [previousServiceTypes, setPreviousServiceTypes] = useState<string[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get default subatividades from the hook to use as fallback
  const { defaultSubatividades } = useServicoSubatividades();

  // Load default values only once on initialization
  useEffect(() => {
    if (hasInitialized) return;
    
    if (defaultValues?.servicosSubatividades) {
      setServicosSubatividades(prev => {
        if (isEqual(prev, defaultValues.servicosSubatividades)) return prev;
        return defaultValues.servicosSubatividades ?? {};
      });
    }
    
    if (defaultValues?.servicosDescricoes) {
      setServicosDescricoes(prev => {
        if (isEqual(prev, defaultValues.servicosDescricoes)) return prev;
        return defaultValues.servicosDescricoes ?? {};
      });
    }
    
    setHasInitialized(true);
  }, [defaultValues?.servicosSubatividades, defaultValues?.servicosDescricoes, hasInitialized]);

  // Load subatividades for each service type - with optimizations
  useEffect(() => {
    // Check if service types actually changed to avoid unnecessary loads
    if (isEqual(servicosTipos.sort(), previousServiceTypes.sort())) return;
    
    setPreviousServiceTypes([...servicosTipos]);
    
    // Track pending async operations
    let isMounted = true;
    const pendingOperations: Record<string, boolean> = {};
    
    const loadSubatividades = async (tipo: TipoServico) => {
      // Skip if we've already started loading this type
      if (pendingOperations[tipo]) return;
      pendingOperations[tipo] = true;
      
      try {
        const subatividadesList = await getSubatividadesByTipo(tipo);
        
        // Only update state if component is still mounted
        if (!isMounted) return;

        setServicosSubatividades(prev => {
          // Get existing subatividades from current state
          const existingSubatividades = prev[tipo] || [];
          // Get default values from form initialization (if editing an order)
          const defaultSubatividades = defaultValues?.servicosSubatividades?.[tipo] || [];
          
          // If we got an empty list from the API but have defaultSubatividades from the hook,
          // use those as a fallback
          let availableSubatividades = subatividadesList;
          if ((!subatividadesList || subatividadesList.length === 0) && defaultSubatividades[tipo]) {
            // Convert string array to SubAtividade array
            availableSubatividades = defaultSubatividades[tipo].map(nome => ({
              id: nome,
              nome: nome,
              selecionada: true,
              concluida: false
            }));
          }
          
          // Create a combined list of all subactivities, preserving states from existing selections
          const updatedSubatividades = (availableSubatividades || []).map(sub => {
            // Look for this subatividade in existing or default values
            const existingItem = existingSubatividades.find(s => s.id === sub.id);
            const defaultItem = defaultSubatividades.find(s => s.id === sub.id);
            
            // Prioritize: 1. Current state, 2. Default values, 3. New values
            return {
              ...sub,
              selecionada: existingItem?.selecionada ?? defaultItem?.selecionada ?? false,
              concluida: existingItem?.concluida ?? defaultItem?.concluida ?? false
            };
          });
          
          // Compare with previous state - only update if there's a real change
          const currentSubatividades = prev[tipo] || [];
          if (isEqual(currentSubatividades, updatedSubatividades)) {
            return prev;
          }
          
          // If we received nothing from the API, check for existing service data
          if (!availableSubatividades || availableSubatividades.length === 0) {
            // If we don't have any subatividades for this tipo but have existing ones in the form data,
            // keep those existing ones
            if (defaultSubatividades && defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
              return {
                ...prev,
                [tipo]: defaultValues.servicosSubatividades[tipo]
              };
            }
          }
          
          return {
            ...prev,
            [tipo]: updatedSubatividades
          };
        });
      } catch (error) {
        console.error(`Erro ao carregar subatividades para ${tipo}:`, error);
        
        // If there was an error fetching from API but we have default subatividades for this type,
        // use those instead of showing an empty list
        if (defaultSubatividades && defaultSubatividades[tipo as TipoServico]) {
          setServicosSubatividades(prev => {
            // If we already have subatividades for this type (from editing an existing order),
            // keep those instead of overwriting with defaults
            if (prev[tipo] && prev[tipo].length > 0) {
              return prev;
            }
            
            // Otherwise use the defaults from the hook as a fallback
            const defaultSubs = defaultSubatividades[tipo as TipoServico].map(nome => ({
              id: nome,
              nome,
              selecionada: true,
              concluida: false,
            }));
            
            return {
              ...prev,
              [tipo]: defaultSubs
            };
          });
        } else {
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: []
          }));
        }
      } finally {
        pendingOperations[tipo] = false;
      }
    };

    // Always load subatividades for all selected service types
    servicosTipos.forEach((tipo) => {
      loadSubatividades(tipo as TipoServico);
    });

    // Remover subatividades de tipos que não estão mais selecionados
    setServicosSubatividades(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach((tipo) => {
        if (!servicosTipos.includes(tipo)) {
          delete newState[tipo];
        }
      });
      return newState;
    });
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [servicosTipos, defaultValues?.servicosSubatividades, previousServiceTypes, defaultSubatividades]);

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
    handleServicoDescricaoChange,
    handleSubatividadesChange
  };
};
