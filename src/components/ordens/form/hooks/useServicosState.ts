
import { useState, useEffect, useCallback } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { getSubatividadesByTipo, getAllSubatividades } from "@/services/subatividadeService";
import { isEqual } from "lodash";
import { FormValues } from "../types";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import { toast } from "sonner";

export const useServicosState = (
  servicosTipos: string[], 
  defaultValues?: Partial<FormValues>
) => {
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [servicosSubatividades, setServicosSubatividades] = useState<Record<string, SubAtividade[]>>({});
  
  // Keep track of previously loaded service types to prevent unnecessary rerenders
  const [previousServiceTypes, setPreviousServiceTypes] = useState<string[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [debugInfoLoaded, setDebugInfoLoaded] = useState(false);

  // Get default subatividades from the hook to use as fallback
  const { defaultSubatividades } = useServicoSubatividades();

  // Carregar diagnóstico inicial - apenas uma vez
  useEffect(() => {
    if (!debugInfoLoaded) {
      const loadDebugInfo = async () => {
        try {
          console.log("🔍 [DIAGNÓSTICO] Carregando todas as subatividades do banco para verificação...");
          const allSubs = await getAllSubatividades();
          console.log("🔍 [DIAGNÓSTICO] Total de subatividades no banco:", allSubs.length);
          console.log("🔍 [DIAGNÓSTICO] Subatividades por tipo:");
          
          // Agrupar por tipo para visualizar melhor
          const grouped = allSubs.reduce((acc, item) => {
            if (!acc[item.tipoServico]) {
              acc[item.tipoServico] = [];
            }
            acc[item.tipoServico].push(item);
            return acc;
          }, {} as Record<string, any[]>);
          
          Object.entries(grouped).forEach(([tipo, items]) => {
            console.log(`   - ${tipo}: ${items.length} itens`);
            console.log(`     - Exemplos: ${items.map(i => i.nome).join(', ').substring(0, 100)}...`);
          });
          
          setDebugInfoLoaded(true);
        } catch (error) {
          console.error("🔍 [DIAGNÓSTICO] Erro ao carregar informações de diagnóstico:", error);
        }
      };
      
      loadDebugInfo();
    }
  }, [debugInfoLoaded]);

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
    
    console.log("🔄 [useServicosState] Tipos de serviço mudaram:", servicosTipos);
    console.log("🔄 [useServicosState] Tipos anteriores:", previousServiceTypes);
    
    setPreviousServiceTypes([...servicosTipos]);
    
    // Track pending async operations
    let isMounted = true;
    const pendingOperations: Record<string, boolean> = {};
    
    const loadSubatividades = async (tipo: TipoServico) => {
      // Skip if we've already started loading this type
      if (pendingOperations[tipo]) {
        console.log(`⏭️ [loadSubatividades] Já está carregando subatividades para ${tipo}, pulando...`);
        return;
      }
      pendingOperations[tipo] = true;
      
      try {
        console.log(`🔍 [loadSubatividades] Buscando subatividades do banco para ${tipo}...`);
        
        // Buscar todas as subatividades primeiro para verificar
        const allSubs = await getAllSubatividades();
        const tipoSubs = allSubs.filter(s => s.tipoServico === tipo);
        console.log(`🔍 [loadSubatividades] Encontradas ${tipoSubs.length} subatividades para ${tipo} no banco (verificação inicial)`);
        
        // Buscar as subatividades específicas do tipo
        const subatividadesList = await getSubatividadesByTipo(tipo);
        console.log(`🔍 [loadSubatividades] Recebidas do banco para ${tipo}:`, subatividadesList);
        
        // Se tiver subatividades no banco por verificação inicial, mas a consulta retornou vazio,
        // temos um problema na consulta
        if (tipoSubs.length > 0 && subatividadesList.length === 0) {
          console.warn(`⚠️ [loadSubatividades] AVISO: Inconsistência detectada! Verificação inicial encontrou ${tipoSubs.length} subatividades para ${tipo}, mas a consulta retornou lista vazia.`);
          
          // Mostrar notificação para o usuário
          toast.warning(`Inconsistência detectada nas subatividades de ${tipo}. Verifique o console para mais detalhes.`);
        }
        
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
            console.log(`✅ [loadSubatividades] Usando subatividades do banco para ${tipo}:`, dbSubatividades);
          } else {
            console.log(`❌ [loadSubatividades] Nenhuma subatividade encontrada no banco para ${tipo}`);
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
            console.log(`📋 [loadSubatividades] Subatividades padrão para ${tipo}:`, defaultSubs);
          }
          
          // Decide which set of subatividades to use, with proper priority
          let finalSubatividades: SubAtividade[] = [];
          
          // If we're editing an existing ordem with this service type
          if (existingSubatividades.length > 0) {
            console.log(`🔄 [loadSubatividades] Usando subatividades existentes do modo de edição para ${tipo}`);
            finalSubatividades = [...existingSubatividades];
          } 
          // If we have current selections for this type in the form
          else if (currentSubatividades.length > 0) {
            console.log(`🔄 [loadSubatividades] Usando subatividades atuais do formulário para ${tipo}`);
            finalSubatividades = [...currentSubatividades];
          }
          // If we got subatividades from the database
          else if (dbSubatividades.length > 0) {
            console.log(`🔄 [loadSubatividades] Usando subatividades do banco para ${tipo}`);
            finalSubatividades = [...dbSubatividades];
          }
          // Fallback to default subatividades
          else if (defaultSubs.length > 0) {
            console.log(`🔄 [loadSubatividades] Usando subatividades padrão de fallback para ${tipo}`);
            finalSubatividades = [...defaultSubs];
          }
          
          // If nothing has changed, return previous state
          if (isEqual(currentSubatividades, finalSubatividades)) {
            console.log(`⏭️ [loadSubatividades] Nenhuma mudança nas subatividades para ${tipo}, mantendo estado atual`);
            return prev;
          }
          
          console.log(`✅ [loadSubatividades] Subatividades finais para ${tipo}:`, finalSubatividades);
          return {
            ...prev,
            [tipo]: finalSubatividades
          };
        });
      } catch (error) {
        console.error(`❌ [loadSubatividades] Erro ao carregar subatividades para ${tipo}:`, error);
        
        // If there was an error fetching from API but we have subatividades for this type in edit mode,
        // keep those instead of showing an empty list
        if (defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
          console.log(`🔄 [loadSubatividades] Ocorreu um erro, mas usando subatividades existentes do modo de edição para ${tipo}`);
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: defaultValues.servicosSubatividades![tipo]
          }));
        } 
        // If we have default subatividades for this type, use those as fallback
        else if (defaultSubatividades && defaultSubatividades[tipo as TipoServico]) {
          console.log(`🔄 [loadSubatividades] Ocorreu um erro, usando subatividades padrão de fallback para ${tipo}`);
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
