import { useState, useEffect, useCallback, useMemo } from "react";
import { SubAtividade, TipoServico, EtapaOS, TipoAtividade } from "@/types/ordens";
import { getSubatividades, getSubatividadesByTipo } from "@/services/subatividadeService";
import { FormValues } from "../types";
import { isEqual } from "lodash";

export const useOrdemFormData = (
  servicosTipos: string[],
  defaultValues?: Partial<FormValues>,
  defaultFotosEntrada: any[] = [],
  defaultFotosSaida: any[] = []
) => {
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [servicosSubatividades, setServicosSubatividades] = useState<Record<string, SubAtividade[]>>({});
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);
  const [etapasConfig, setEtapasConfig] = useState<Record<TipoAtividade, SubAtividade[]>>({
    lavagem: [],
    inspecao_inicial: [],
    inspecao_final: []
  });
  const [isLoadingEtapas, setIsLoadingEtapas] = useState(false);
  const [etapasTempoPreco, setEtapasTempoPreco] = useState<Record<string, {precoHora?: number, tempoEstimado?: number}>>({
    lavagem: {precoHora: 0, tempoEstimado: 0},
    inspecao_inicial: {precoHora: 0, tempoEstimado: 0},
    inspecao_final: {precoHora: 0, tempoEstimado: 0},
    retifica: {precoHora: 0, tempoEstimado: 0},
    montagem: {precoHora: 0, tempoEstimado: 0},
    dinamometro: {precoHora: 0, tempoEstimado: 0}
  });
  
  // Keep track of previously loaded service types to prevent unnecessary rerenders
  const [previousServiceTypes, setPreviousServiceTypes] = useState<string[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Process default fotos
  useEffect(() => {
    const processDefaultFotos = () => {
      if (defaultFotosEntrada && defaultFotosEntrada.length > 0) {
        const processedFotos = defaultFotosEntrada.map((foto: any) => {
          if (foto && typeof foto === 'object' && 'data' in foto) {
            return foto.data;
          }
          return foto;
        });
        setFotosEntrada(processedFotos as any);
      }

      if (defaultFotosSaida && defaultFotosSaida.length > 0) {
        const processedFotos = defaultFotosSaida.map((foto: any) => {
          if (foto && typeof foto === 'object' && 'data' in foto) {
            return foto.data;
          }
          return foto;
        });
        setFotosSaida(processedFotos as any);
      }
    };

    processDefaultFotos();
  }, [defaultFotosEntrada, defaultFotosSaida]);

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
    
    if (defaultValues?.etapasTempoPreco) {
      setEtapasTempoPreco(prev => {
        if (isEqual(prev, defaultValues.etapasTempoPreco)) return prev;
        return {
          ...prev,
          ...defaultValues.etapasTempoPreco as any
        };
      });
    }
    
    setHasInitialized(true);
  }, [defaultValues?.servicosSubatividades, defaultValues?.servicosDescricoes, defaultValues?.etapasTempoPreco, hasInitialized]);

  // Fetch etapas configuration
  useEffect(() => {
    const fetchEtapasConfig = async () => {
      setIsLoadingEtapas(true);
      try {
        const etapasData = await getSubatividades();
        
        // Apenas precisamos das etapas lavagem, inspecao_inicial e inspecao_final
        const tiposAtividade: TipoAtividade[] = ['lavagem', 'inspecao_inicial', 'inspecao_final'];
        
        // Para cada tipo de atividade, atualize o tempo padrão se houver subatividades
        tiposAtividade.forEach((tipo) => {
          if (etapasData[tipo] && etapasData[tipo].length > 0) {
            // Use o tempo estimado da primeira subatividade como tempo padrão
            const defaultTempo = etapasData[tipo][0].tempoEstimado || 0;
            
            setEtapasTempoPreco(prev => ({
              ...prev,
              [tipo]: { 
                ...prev[tipo],
                tempoEstimado: defaultTempo 
              }
            }));
          }
          
          // Guarde as subatividades para referência
          if (etapasData[tipo]) {
            setEtapasConfig(prev => {
              // Only update if there's a change
              if (isEqual(prev[tipo], etapasData[tipo])) return prev;
              
              return {
                ...prev,
                [tipo]: etapasData[tipo]
              };
            });
          }
        });
      } catch (error) {
        console.error("Erro ao buscar configurações de etapas:", error);
      } finally {
        setIsLoadingEtapas(false);
      }
    };
    
    fetchEtapasConfig();
  }, []);

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
          
          // Create a combined list of all subactivities, preserving states from existing selections
          const updatedSubatividades = (subatividadesList || []).map(sub => {
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
          
          return {
            ...prev,
            [tipo]: updatedSubatividades
          };
        });
      } catch (error) {
        console.error(`Erro ao carregar subatividades para ${tipo}:`, error);
        if (isMounted) {
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
  }, [servicosTipos, defaultValues?.servicosSubatividades, previousServiceTypes]);

  // Memoized callbacks to prevent unnecessary re-renders
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
  
  const handleEtapaTempoPrecoChange = useCallback((etapa: EtapaOS, field: 'precoHora' | 'tempoEstimado', value: number) => {
    setEtapasTempoPreco(prev => {
      // Skip update if no actual changes
      if (prev[etapa]?.[field] === value) return prev;
      
      return {
        ...prev,
        [etapa]: {
          ...prev[etapa],
          [field]: value
        }
      };
    });
  }, []);

  // Use memoized values for outputs that don't need to change on every render
  const memoizedState = useMemo(() => ({
    servicosDescricoes,
    servicosSubatividades, 
    fotosEntrada,
    fotosSaida,
    etapasConfig,
    isLoadingEtapas,
    etapasTempoPreco,
  }), [
    servicosDescricoes,
    servicosSubatividades,
    fotosEntrada, 
    fotosSaida,
    etapasConfig,
    isLoadingEtapas,
    etapasTempoPreco
  ]);

  return {
    ...memoizedState,
    setFotosEntrada,
    setFotosSaida,
    handleServicoDescricaoChange,
    handleSubatividadesChange,
    handleEtapaTempoPrecoChange
  };
};
