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
        console.log(`Fetching subatividades from database for ${tipo}...`);
        const subatividadesList = await getSubatividadesByTipo(tipo);
        console.log(`Received from database for ${tipo}:`, subatividadesList);
        
        // Only update state if component is still mounted
        if (!isMounted) return;

        setServicosSubatividades(prev => {
          // First priority: Existing subatividades from edit mode
          const existingSubatividades = defaultValues?.servicosSubatividades?.[tipo] || [];
          
          // Second priority: Currently selected subatividades (in form)
          const currentSubatividades = prev[tipo] || [];
          
          // Third priority: Subatividades from database
          let dbSubatividades: SubAtividade[] = [];
          if (subatividadesList && subatividadesList.length > 0) {
            dbSubatividades = subatividadesList.map(sub => ({
              ...sub,
              selecionada: true, // Default to selected for new items
              concluida: false
            }));
            console.log(`Using database subatividades for ${tipo}:`, dbSubatividades);
          }
          
          // Fourth priority: Default subatividades from hook
          let defaultSubs: SubAtividade[] = [];
          if (defaultSubatividades && defaultSubatividades[tipo]) {
            defaultSubs = defaultSubatividades[tipo].map(nome => ({
              id: nome,
              nome: nome,
              selecionada: true,
              concluida: false
            }));
            console.log(`Fallback default subatividades for ${tipo}:`, defaultSubs);
          }
          
          // Decide which set of subatividades to use, with proper priority
          let finalSubatividades: SubAtividade[] = [];
          
          // If we're editing an existing ordem with this service type
          if (existingSubatividades.length > 0) {
            console.log(`Using existing subatividades from edit mode for ${tipo}`);
            finalSubatividades = [...existingSubatividades];
          } 
          // If we have current selections for this type in the form
          else if (currentSubatividades.length > 0) {
            console.log(`Using current form subatividades for ${tipo}`);
            finalSubatividades = [...currentSubatividades];
          }
          // If we got subatividades from the database
          else if (dbSubatividades.length > 0) {
            console.log(`Using database subatividades for ${tipo}`);
            finalSubatividades = [...dbSubatividades];
          }
          // Fallback to default subatividades
          else if (defaultSubs.length > 0) {
            console.log(`Using default fallback subatividades for ${tipo}`);
            finalSubatividades = [...defaultSubs];
          }
          
          // If nothing has changed, return previous state
          if (isEqual(currentSubatividades, finalSubatividades)) {
            return prev;
          }
          
          console.log(`Final subatividades for ${tipo}:`, finalSubatividades);
          return {
            ...prev,
            [tipo]: finalSubatividades
          };
        });
      } catch (error) {
        console.error(`Erro ao carregar subatividades para ${tipo}:`, error);
        
        // If there was an error fetching from API but we have subatividades for this type in edit mode,
        // keep those instead of showing an empty list
        if (defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
          console.log(`Error occurred, but using existing subatividades from edit mode for ${tipo}`);
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: defaultValues.servicosSubatividades![tipo]
          }));
        } 
        // If we have default subatividades for this type, use those as fallback
        else if (defaultSubatividades && defaultSubatividades[tipo as TipoServico]) {
          console.log(`Error occurred, using default fallback subatividades for ${tipo}`);
          setServicosSubatividades(prev => {
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
