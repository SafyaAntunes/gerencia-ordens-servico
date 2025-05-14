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
  const [loadingSources, setLoadingSources] = useState<Record<string, string>>({});

  // Get default subatividades from the hook to use as fallback only
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
            if (items.length > 0) {
              console.log(`     - Exemplos: ${items.map(i => i.nome).join(', ').substring(0, 100)}...`);
            }
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
      console.log("📝 [useServicosState] Inicializando com subatividades do defaultValues:", defaultValues.servicosSubatividades);
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

  // Load subatividades for each service type - with optimizations and clear source tracking
  useEffect(() => {
    // Check if service types actually changed to avoid unnecessary loads
    if (isEqual(servicosTipos.sort(), previousServiceTypes.sort()) && hasInitialized) {
      return;
    }
    
    console.log("🔄 [useServicosState] Tipos de serviço mudaram:", servicosTipos);
    console.log("🔄 [useServicosState] Tipos anteriores:", previousServiceTypes);
    
    setPreviousServiceTypes([...servicosTipos]);
    
    // Track pending async operations
    let isMounted = true;
    const pendingOperations: Record<string, boolean> = {};
    const sourceTracker: Record<string, string> = {};
    
    const loadSubatividades = async (tipo: TipoServico) => {
      // Skip if we've already started loading this type
      if (pendingOperations[tipo]) {
        console.log(`⏭️ [loadSubatividades] Já está carregando subatividades para ${tipo}, pulando...`);
        return;
      }
      pendingOperations[tipo] = true;
      
      try {
        console.log(`🔍 [loadSubatividades] Buscando subatividades do banco para ${tipo}...`);
        
        // PRIORIDADE 1: Subatividades existentes no modo de edição (defaultValues)
        const existingSubatividades = defaultValues?.servicosSubatividades?.[tipo] || [];
        if (existingSubatividades.length > 0) {
          console.log(`✅ [loadSubatividades] USANDO SUBATIVIDADES DO MODO DE EDIÇÃO para ${tipo}:`, existingSubatividades);
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: existingSubatividades
          }));
          sourceTracker[tipo] = "edição";
          setLoadingSources(prev => ({...prev, [tipo]: "edição"}));
          return;
        }
        
        // PRIORIDADE 2: Buscar subatividades do banco de dados
        console.log(`🔍 [loadSubatividades] Buscando subatividades do banco para ${tipo}...`);
        const dbSubatividades = await getSubatividadesByTipo(tipo);
        console.log(`🔍 [loadSubatividades] Recebidas do banco para ${tipo}:`, dbSubatividades);
        
        if (dbSubatividades && dbSubatividades.length > 0) {
          const formattedSubs = dbSubatividades.map(sub => ({
            ...sub,
            selecionada: true,
            concluida: false
          }));
          
          console.log(`✅ [loadSubatividades] USANDO SUBATIVIDADES DO BANCO para ${tipo}:`, formattedSubs);
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: formattedSubs
          }));
          sourceTracker[tipo] = "banco";
          setLoadingSources(prev => ({...prev, [tipo]: "banco"}));
          return;
        }
        
        // PRIORIDADE 3 (FALLBACK): Usar os valores padrão codificados
        if (defaultSubatividades && defaultSubatividades[tipo]) {
          const defaultSubs = defaultSubatividades[tipo].map(nome => ({
            id: nome,
            nome: nome,
            selecionada: true,
            concluida: false
          }));
          
          console.log(`⚠️ [loadSubatividades] USANDO SUBATIVIDADES PADRÃO (fallback) para ${tipo}:`, defaultSubs);
          toast.warning(`Subatividades de configuração não encontradas para ${tipo}. Usando valores padrão.`);
          
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: defaultSubs
          }));
          sourceTracker[tipo] = "padrão";
          setLoadingSources(prev => ({...prev, [tipo]: "padrão"}));
        } else {
          console.log(`❌ [loadSubatividades] Nenhuma subatividade disponível para ${tipo}`);
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: []
          }));
          sourceTracker[tipo] = "vazio";
          setLoadingSources(prev => ({...prev, [tipo]: "vazio"}));
        }
        
      } catch (error) {
        console.error(`❌ [loadSubatividades] Erro ao carregar subatividades para ${tipo}:`, error);
        toast.error(`Erro ao carregar subatividades para ${tipo}`);
        
        // Se tivermos valores do modo de edição, use-os apesar do erro
        if (defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
          console.log(`🔄 [loadSubatividades] Apesar do erro, usando subatividades do modo de edição para ${tipo}`);
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: defaultValues.servicosSubatividades![tipo]
          }));
          sourceTracker[tipo] = "edição (recuperação de erro)";
          setLoadingSources(prev => ({...prev, [tipo]: "edição (recuperação de erro)"}));
        } 
        // Caso contrário, use os padrões como última opção
        else if (defaultSubatividades && defaultSubatividades[tipo as TipoServico]) {
          console.log(`🔄 [loadSubatividades] Usando padrões como último recurso para ${tipo}`);
          const defaultSubs = defaultSubatividades[tipo as TipoServico].map(nome => ({
            id: nome,
            nome,
            selecionada: true,
            concluida: false,
          }));
          
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: defaultSubs
          }));
          sourceTracker[tipo] = "padrão (recuperação de erro)";
          setLoadingSources(prev => ({...prev, [tipo]: "padrão (recuperação de erro)"}));
        } else {
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: []
          }));
          sourceTracker[tipo] = "vazio (erro)";
          setLoadingSources(prev => ({...prev, [tipo]: "vazio (erro)"}));
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
    
    // Log sources after all loads are complete
    setTimeout(() => {
      console.log("📊 [useServicosState] Origem das subatividades carregadas:", sourceTracker);
    }, 1000);
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [servicosTipos, defaultValues?.servicosSubatividades, previousServiceTypes, defaultSubatividades, hasInitialized]);

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
